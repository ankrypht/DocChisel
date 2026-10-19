import ExpoModulesCore
import PDFKit
import UIKit

// Declare C-ABI symbols exported by libcore_engine.a
@_silgen_name("docchisel_execute_job")
func docchisel_execute_job(_ payload: UnsafePointer<CChar>?) -> UnsafeMutablePointer<CChar>?

@_silgen_name("docchisel_free_string")
func docchisel_free_string(_ ptr: UnsafeMutablePointer<CChar>?)

/**
 * DocChiselBridgeModule
 *
 * Implements the single-dispatcher native entry point for iOS,
 * as well as native PDF page counting and thumbnail rendering via PDFKit.
 */
public class DocChiselBridgeModule: Module {

  private func resolvePdfUrl(_ filePath: String) -> URL? {
    let clean = filePath.hasPrefix("file://") ? String(filePath.dropFirst(7)) : filePath
    let decoded = clean.removingPercentEncoding ?? clean
    if FileManager.default.fileExists(atPath: decoded) {
      return URL(fileURLWithPath: decoded)
    }
    if FileManager.default.fileExists(atPath: clean) {
      return URL(fileURLWithPath: clean)
    }
    return URL(fileURLWithPath: clean)
  }

  private func getThumbnailsDir() -> URL {
    let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
    let thumbsDir = caches.appendingPathComponent("pdf_thumbnails", isDirectory: true)
    try? FileManager.default.createDirectory(at: thumbsDir, withIntermediateDirectories: true)
    return thumbsDir
  }

  private func getThumbCacheUrl(filePath: String, pageIndex: Int, targetWidth: Int) -> URL {
    let clean = filePath.hasPrefix("file://") ? String(filePath.dropFirst(7)) : filePath
    let attrs = try? FileManager.default.attributesOfItem(atPath: clean)
    let mtime = (attrs?[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0
    let size = (attrs?[.size] as? NSNumber)?.int64Value ?? 0
    let key = "\(clean)_\(mtime)_\(size)"
    let hash = String(format: "%08x", key.hashValue)
    let dir = getThumbnailsDir()
    return dir.appendingPathComponent("thumb_\(hash)_p\(pageIndex + 1)_w\(targetWidth).jpg")
  }

  public func definition() -> ModuleDefinition {
    Name("DocChiselBridge")

    AsyncFunction("executeJobAsync") { (payloadJson: String, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        payloadJson.withCString { cStr in
          guard let resPtr = docchisel_execute_job(cStr) else {
            promise.reject("NULL_RESPONSE", "Native engine returned null pointer")
            return
          }
          let resultString = String(cString: resPtr)
          docchisel_free_string(resPtr)
          promise.resolve(resultString)
        }
      }
    }

    AsyncFunction("getPdfPageCountAsync") { (filePath: String, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async { [weak self] in
        guard let self = self, let url = self.resolvePdfUrl(filePath) else {
          promise.reject("INVALID_PATH", "Could not resolve file path: \(filePath)")
          return
        }
        guard let doc = PDFDocument(url: url) else {
          promise.reject("PDF_LOAD_ERROR", "Failed to open PDF document at: \(filePath)")
          return
        }
        promise.resolve(doc.pageCount)
      }
    }

    AsyncFunction("renderPdfThumbnailAsync") { (filePath: String, pageNumber: Int, targetWidth: Int, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async { [weak self] in
        guard let self = self, let url = self.resolvePdfUrl(filePath) else {
          promise.reject("INVALID_PATH", "Could not resolve file path: \(filePath)")
          return
        }
        let pageIndex = max(0, pageNumber - 1)
        let tw = targetWidth > 0 ? targetWidth : 260
        let cacheUrl = self.getThumbCacheUrl(filePath: filePath, pageIndex: pageIndex, targetWidth: tw)

        if FileManager.default.fileExists(atPath: cacheUrl.path) {
          promise.resolve(cacheUrl.absoluteString)
          return
        }

        guard let doc = PDFDocument(url: url) else {
          promise.reject("PDF_LOAD_ERROR", "Failed to open PDF document at: \(filePath)")
          return
        }

        guard let page = doc.page(at: pageIndex) else {
          promise.reject("INVALID_PAGE", "Page index \(pageIndex) out of bounds in document")
          return
        }

        let bounds = page.bounds(for: .mediaBox)
        let pw = bounds.width > 0 ? bounds.width : 1.0
        let ph = bounds.height > 0 ? bounds.height : 1.0
        let th = max(1.0, CGFloat(tw) * ph / pw)
        let size = CGSize(width: CGFloat(tw), height: th)
        let thumbImg = page.thumbnail(of: size, for: .mediaBox)

        if let data = thumbImg.jpegData(compressionQuality: 0.85) {
          try? data.write(to: cacheUrl)
          promise.resolve(cacheUrl.absoluteString)
        } else {
          promise.reject("IMAGE_ERROR", "Failed to compress thumbnail image to JPEG")
        }
      }
    }

    AsyncFunction("renderPdfThumbnailsAsync") { (filePath: String, maxPages: Int, targetWidth: Int, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async { [weak self] in
        guard let self = self, let url = self.resolvePdfUrl(filePath) else {
          promise.reject("INVALID_PATH", "Could not resolve file path: \(filePath)")
          return
        }
        guard let doc = PDFDocument(url: url) else {
          promise.reject("PDF_LOAD_ERROR", "Failed to open PDF document at: \(filePath)")
          return
        }

        let tw = targetWidth > 0 ? targetWidth : 260
        let total = doc.pageCount
        let limit = maxPages > 0 ? min(total, maxPages) : total
        var results: [[String: Any]] = []

        for i in 0..<limit {
          let cacheUrl = self.getThumbCacheUrl(filePath: filePath, pageIndex: i, targetWidth: tw)
          if FileManager.default.fileExists(atPath: cacheUrl.path) {
            results.append([
              "pageNumber": i + 1,
              "uri": cacheUrl.absoluteString
            ])
            continue
          }

          if let page = doc.page(at: i) {
            let bounds = page.bounds(for: .mediaBox)
            let pw = bounds.width > 0 ? bounds.width : 1.0
            let ph = bounds.height > 0 ? bounds.height : 1.0
            let th = max(1.0, CGFloat(tw) * ph / pw)
            let size = CGSize(width: CGFloat(tw), height: th)
            let thumbImg = page.thumbnail(of: size, for: .mediaBox)

            if let data = thumbImg.jpegData(compressionQuality: 0.85) {
              try? data.write(to: cacheUrl)
              results.append([
                "pageNumber": i + 1,
                "uri": cacheUrl.absoluteString,
                "width": Int(tw),
                "height": Int(th)
              ])
            }
          }
        }

        promise.resolve(results)
      }
    }
  }
}

