package com.docchisel.bridge

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.sun.jna.Library
import com.sun.jna.Native
import com.sun.jna.Pointer
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.net.URLDecoder

/**
 * C-ABI binding interface to libcore_engine.so via JNA
 */
interface CoreEngineCAbi : Library {
    fun docchisel_execute_job(payload: String): Pointer
    fun docchisel_free_string(ptr: Pointer)

    companion object {
        val INSTANCE: CoreEngineCAbi by lazy {
            Native.load("core_engine", CoreEngineCAbi::class.java)
        }
    }
}

/**
 * DocChiselBridgeModule
 *
 * Exposes native functions:
 * - executeJobAsync(payloadJson): Dispatches jobs to the Rust core engine via C-ABI on Dispatchers.IO.
 * - getPdfPageCountAsync(filePath): High-speed native PDF page counting via Android PdfRenderer.
 * - renderPdfThumbnailAsync(filePath, pageNumber, targetWidth): Generates JPEG thumbnail for single PDF page.
 * - renderPdfThumbnailsAsync(filePath, maxPages, targetWidth): Batch generates JPEG thumbnails for PDF pages.
 */
class DocChiselBridgeModule : Module() {

    private fun openParcelFileDescriptor(filePath: String): ParcelFileDescriptor {
        val clean = if (filePath.startsWith("file://")) filePath.removePrefix("file://") else filePath
        val decoded = try { URLDecoder.decode(clean, "UTF-8") } catch (_: Exception) { clean }

        val file = File(decoded)
        if (file.exists() && file.isFile) {
            return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
        }

        val orig = File(clean)
        if (orig.exists() && orig.isFile) {
            return ParcelFileDescriptor.open(orig, ParcelFileDescriptor.MODE_READ_ONLY)
        }

        if (filePath.startsWith("content://")) {
            val context = appContext.reactContext
                ?: throw IllegalStateException("React application context not available")
            val uri = android.net.Uri.parse(filePath)
            return context.contentResolver.openFileDescriptor(uri, "r")
                ?: throw FileNotFoundException("Could not open content URI: $filePath")
        }

        throw FileNotFoundException("PDF file not found at: $filePath")
    }

    private fun getThumbCacheFile(filePath: String, pageIndex: Int, targetWidth: Int): File {
        val clean = if (filePath.startsWith("file://")) filePath.removePrefix("file://") else filePath
        val f = File(clean)
        val mtime = if (f.exists()) f.lastModified() else 0L
        val size = if (f.exists()) f.length() else 0L
        val rawKey = "${clean}_${mtime}_${size}"
        val hash = Integer.toHexString(rawKey.hashCode())
        val dir = File(appContext.cacheDirectory, "pdf_thumbnails")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return File(dir, "thumb_${hash}_p${pageIndex + 1}_w${targetWidth}.jpg")
    }

    private fun getPdfPageCountInternal(filePath: String): Int {
        var pfd: ParcelFileDescriptor? = null
        var renderer: PdfRenderer? = null
        try {
            pfd = openParcelFileDescriptor(filePath)
            renderer = PdfRenderer(pfd)
            return renderer.pageCount
        } finally {
            try { renderer?.close() } catch (_: Throwable) {}
            try { pfd?.close() } catch (_: Throwable) {}
        }
    }

    private fun renderSingleThumbnailInternal(
        filePath: String,
        pageNumber: Int,
        targetWidth: Int
    ): String {
        val pageIndex = (pageNumber - 1).coerceAtLeast(0)
        val tw = if (targetWidth > 0) targetWidth else 260
        val cached = getThumbCacheFile(filePath, pageIndex, tw)
        if (cached.exists() && cached.length() > 0) {
            return "file://${cached.absolutePath}"
        }

        var pfd: ParcelFileDescriptor? = null
        var renderer: PdfRenderer? = null
        try {
            pfd = openParcelFileDescriptor(filePath)
            renderer = PdfRenderer(pfd)
            if (pageIndex >= renderer.pageCount) {
                throw IllegalArgumentException("Page number $pageNumber exceeds total pages (${renderer.pageCount})")
            }
            val page = renderer.openPage(pageIndex)
            try {
                val pageW = if (page.width > 0) page.width else 1
                val pageH = if (page.height > 0) page.height else 1
                val th = ((tw.toLong() * pageH) / pageW).toInt().coerceAtLeast(1)

                val bitmap = Bitmap.createBitmap(tw, th, Bitmap.Config.ARGB_8888)
                bitmap.eraseColor(Color.WHITE)
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

                FileOutputStream(cached).use { fos ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 85, fos)
                    fos.flush()
                }
                bitmap.recycle()

                return "file://${cached.absolutePath}"
            } finally {
                page.close()
            }
        } finally {
            try { renderer?.close() } catch (_: Throwable) {}
            try { pfd?.close() } catch (_: Throwable) {}
        }
    }

    private fun renderPdfThumbnailsInternal(
        filePath: String,
        maxPages: Int,
        targetWidth: Int
    ): List<Map<String, Any>> {
        val tw = if (targetWidth > 0) targetWidth else 260
        var pfd: ParcelFileDescriptor? = null
        var renderer: PdfRenderer? = null
        val results = mutableListOf<Map<String, Any>>()

        try {
            pfd = openParcelFileDescriptor(filePath)
            renderer = PdfRenderer(pfd)
            val total = renderer.pageCount
            val limit = if (maxPages > 0) minOf(total, maxPages) else total

            for (i in 0 until limit) {
                val cached = getThumbCacheFile(filePath, i, tw)
                if (cached.exists() && cached.length() > 0) {
                    results.add(
                        mapOf(
                            "pageNumber" to (i + 1),
                            "uri" to "file://${cached.absolutePath}",
                            "width" to tw
                        )
                    )
                    continue
                }

                val page = renderer.openPage(i)
                try {
                    val pageW = if (page.width > 0) page.width else 1
                    val pageH = if (page.height > 0) page.height else 1
                    val th = ((tw.toLong() * pageH) / pageW).toInt().coerceAtLeast(1)

                    val bitmap = Bitmap.createBitmap(tw, th, Bitmap.Config.ARGB_8888)
                    bitmap.eraseColor(Color.WHITE)
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

                    FileOutputStream(cached).use { fos ->
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, fos)
                        fos.flush()
                    }
                    bitmap.recycle()

                    results.add(
                        mapOf(
                            "pageNumber" to (i + 1),
                            "uri" to "file://${cached.absolutePath}",
                            "width" to tw,
                            "height" to th
                        )
                    )
                } finally {
                    page.close()
                }
            }
        } finally {
            try { renderer?.close() } catch (_: Throwable) {}
            try { pfd?.close() } catch (_: Throwable) {}
        }

        return results
    }

    override fun definition() = ModuleDefinition {
        Name("DocChiselBridge")

        AsyncFunction("executeJobAsync") { payloadJson: String, promise: Promise ->
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val lib = CoreEngineCAbi.INSTANCE
                    val resPtr = lib.docchisel_execute_job(payloadJson)
                    if (resPtr == null) {
                        promise.reject("NULL_RESPONSE", "Native engine returned null pointer", null)
                        return@launch
                    }
                    val resultString = resPtr.getString(0, "UTF-8")
                    lib.docchisel_free_string(resPtr)
                    promise.resolve(resultString)
                } catch (e: Throwable) {
                    promise.reject("DOCCHISEL_BRIDGE_ERROR", e.message ?: "Native core_engine execution failed", e)
                }
            }
        }

        AsyncFunction("getPdfPageCountAsync") { filePath: String, promise: Promise ->
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val count = getPdfPageCountInternal(filePath)
                    promise.resolve(count)
                } catch (e: Throwable) {
                    promise.reject("PAGE_COUNT_ERROR", e.message ?: "Failed to get page count", e)
                }
            }
        }

        AsyncFunction("renderPdfThumbnailAsync") { filePath: String, pageNumber: Int, targetWidth: Int, promise: Promise ->
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val uri = renderSingleThumbnailInternal(filePath, pageNumber, targetWidth)
                    promise.resolve(uri)
                } catch (e: Throwable) {
                    promise.reject("THUMBNAIL_ERROR", e.message ?: "Failed to render PDF thumbnail", e)
                }
            }
        }

        AsyncFunction("renderPdfThumbnailsAsync") { filePath: String, maxPages: Int, targetWidth: Int, promise: Promise ->
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val results = renderPdfThumbnailsInternal(filePath, maxPages, targetWidth)
                    promise.resolve(results)
                } catch (e: Throwable) {
                    promise.reject("THUMBNAILS_ERROR", e.message ?: "Failed to render PDF thumbnails", e)
                }
            }
        }
    }
}
