import { onRequestPost as __api_auth_js_onRequestPost } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\auth.js"
import { onRequestDelete as __api_gallery_js_onRequestDelete } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\gallery.js"
import { onRequestGet as __api_gallery_js_onRequestGet } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\gallery.js"
import { onRequestPost as __api_gallery_js_onRequestPost } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\gallery.js"
import { onRequestPut as __api_gallery_js_onRequestPut } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\gallery.js"
import { onRequestDelete as __api_inquiries_js_onRequestDelete } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\inquiries.js"
import { onRequestGet as __api_inquiries_js_onRequestGet } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\inquiries.js"
import { onRequestPost as __api_inquiries_js_onRequestPost } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\inquiries.js"
import { onRequestGet as __api_services_js_onRequestGet } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\services.js"
import { onRequestPut as __api_services_js_onRequestPut } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\services.js"
import { onRequestPost as __api_upload_js_onRequestPost } from "C:\\Users\\xiiil\\github\\pce\\functions\\api\\upload.js"

export const routes = [
    {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_js_onRequestPost],
    },
  {
      routePath: "/api/gallery",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_gallery_js_onRequestDelete],
    },
  {
      routePath: "/api/gallery",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_gallery_js_onRequestGet],
    },
  {
      routePath: "/api/gallery",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_gallery_js_onRequestPost],
    },
  {
      routePath: "/api/gallery",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_gallery_js_onRequestPut],
    },
  {
      routePath: "/api/inquiries",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_inquiries_js_onRequestDelete],
    },
  {
      routePath: "/api/inquiries",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_inquiries_js_onRequestGet],
    },
  {
      routePath: "/api/inquiries",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_inquiries_js_onRequestPost],
    },
  {
      routePath: "/api/services",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_services_js_onRequestGet],
    },
  {
      routePath: "/api/services",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_services_js_onRequestPut],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_js_onRequestPost],
    },
  ]