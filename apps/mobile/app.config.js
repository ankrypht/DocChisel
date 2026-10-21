import pkg from "./package.json";

const IS_DEV = process.env.APP_VARIANT === "development";

const getVersionCode = (version) => {
  const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
  return major * 1000000 + minor * 1000 + patch;
};

export default {
  name: IS_DEV ? "DocChisel (Dev)" : "DocChisel",
  slug: "docchisel",
  version: pkg.version,
  orientation: "default",
  icon: "./assets/icon.png",
  scheme: IS_DEV ? "docchisel-dev" : "docchisel",
  userInterfaceStyle: "dark",
  platforms: ["android", "ios"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV
      ? "com.ankushsarkar.docchisel.dev"
      : "com.ankushsarkar.docchisel",
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        "DocChisel needs access to your photo library to import images for conversion and editing.",
      NSPhotoLibraryAddUsageDescription:
        "DocChisel needs permission to save processed images to your photo library.",
    },
  },
  android: {
    package: IS_DEV
      ? "com.ankushsarkar.docchisel.dev"
      : "com.ankushsarkar.docchisel",
    versionCode: getVersionCode(pkg.version),
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0B84FE",
      monochromeImage: "./assets/adaptive-monochrome.png",
    },
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0B84FE",
        image: "./assets/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};
