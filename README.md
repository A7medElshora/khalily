# Khalily

Smart Fitting Room — Cross-Platform Hybrid Virtual Try-On



Act as a senior full-stack engineer, computer vision engineer, AI integration specialist, and product designer.



Build a production-oriented MVP for a multi-device AI-powered Virtual Fitting Room.



IMPORTANT: This project is NOT limited to televisions, desktop computers, or external webcams.



It must work as ONE responsive web application across:



1. Android smartphones.

2. iPhones and iPads.

3. Android tablets.

4. Desktop computers.

5. Laptops.

6. Smart TVs with compatible browsers.

7. External monitors connected to computers.



Do not create separate applications for each device.



Build one responsive application that adapts its layout and camera behavior to the current device.



1. Main Product Concept



The customer opens the application, grants camera access, stands in front of the camera, selects clothing from the store catalog, and sees the clothing virtually applied to their body.



Implement two independent engines:



A. Live Virtual Try-On



- Real-time camera feed.

- Full-body detection.

- Pose estimation.

- Body landmark tracking.

- Clothing overlay.

- Mesh deformation.

- Basic occlusion.

- Continuous tracking during movement.



B. AI Realistic Try-On



- Capture a customer image after explicit consent.

- Select an actual store garment.

- Send both images to a real AI virtual try-on service.

- Generate a realistic try-on result.

- Show the result beside the live camera.

- Compare AI and Live results.



The Live engine must remain functional if AI services fail.



2. Cross-Platform Architecture



Use:



- React.

- TypeScript.

- Vite.

- Tailwind CSS.

- shadcn/ui.

- MediaPipe Tasks Vision.

- MediaPipe Pose Landmarker.

- Canvas / WebGL.

- Three.js only where necessary.

- Supabase PostgreSQL.

- Supabase Storage.

- Supabase Authentication.

- Supabase Edge Functions.

- FASHN AI API.



Build a responsive Progressive Web App (PWA).



Support installation on compatible devices.



Do not require Electron or a native application for the initial MVP.



Use HTTPS-compatible camera access.



Ensure camera APIs and browser permissions are handled correctly.



3. Responsive Interface



Create three layout modes:



Mobile



- Vertical layout.

- Camera preview as the primary area.

- Compact horizontal clothing carousel.

- Large touch-friendly buttons.

- Camera switch control.

- Product details in a bottom sheet.

- AI Try-On button.

- Support portrait and landscape orientations.



Tablet



- Camera area approximately 60%.

- Product catalog approximately 40%.

- Touch-friendly product cards.

- Easy product selection.



Desktop / TV



- Large camera area approximately 65%.

- Clothing catalog approximately 35%.

- Fullscreen kiosk mode.

- Large product cards.

- Keyboard and mouse support.

- Optional external touch display support.



Automatically adapt the layout using responsive breakpoints.



Do not merely scale the desktop interface down to fit mobile.



Design each layout specifically for its screen size.



4. Camera Manager



Build a reusable CameraManager module.



Requirements:



- Detect available cameras.

- Request camera permissions only when entering the fitting room.

- Support front and rear smartphone cameras.

- Support USB webcams.

- Support integrated laptop cameras.

- Allow switching between available cameras.

- Select suitable resolutions according to hardware capabilities.

- Handle portrait and landscape video.

- Support mirroring for selfie cameras.

- Allow the customer to toggle mirroring.

- Handle camera disconnection.

- Display clear permission and hardware errors.

- Release camera tracks when exiting the session.



Prioritize rear camera on smartphones when full-body fitting is needed.



Do not assume all devices have the same camera capabilities.



Allow the customer to change cameras without unnecessarily restarting the entire application.



5. Live Try-On Engine



Build a modular LiveTryOnEngine.



Use MediaPipe Pose Landmarker.



Implement:



- Full-body detection.

- 33 body landmarks where supported.

- Shoulder detection.

- Elbow detection.

- Wrist detection.

- Hip detection.

- Knee and ankle detection.

- Landmark smoothing.

- Tracking stability.

- Body segmentation where supported.

- Clothing mesh deformation.

- Basic arm and body occlusion.



Start with upper-body clothing:



- T-shirts.

- Shirts.

- Hoodies.

- Jackets.



Then extend support to:



- Trousers.

- Jeans.

- Dresses.



Create a dedicated ClothingOverlayRenderer.



Do not use static fixed-position clothing images.



The garment must adapt to detected body landmarks.



Document limitations of 2D AR rendering.



Do not claim realistic fabric physics.



Keep the rendering pipeline independent from React UI state.



6. Store Clothing Management — CRITICAL FEATURE



The store owner must be able to upload their OWN clothing products.



Do not rely only on sample products or externally generated clothing.



Build a complete product upload and management system.



Product Upload



Support:



- Single image upload.

- Multiple image upload.

- Drag and drop.

- Mobile gallery selection.

- Camera capture where supported.

- JPG.

- JPEG.

- PNG.

- WebP.



Allow uploading multiple views of the same garment.



Product Information



Each product must include:



- Product name.

- SKU.

- Description.

- Category.

- Gender / collection.

- Price.

- Discount price.

- Colors.

- Available sizes.

- Stock quantity.

- Main image.

- Live overlay image.

- AI garment image.

- Active / inactive status.



Image Processing



Build a garment image preparation workflow.



Allow:



1. Uploading an ordinary clothing photo.

2. Previewing the original image.

3. Removing the background using an appropriate image-processing service or model.

4. Producing a transparent PNG where possible.

5. Previewing the processed image.

6. Manually adjusting crop and positioning.

7. Saving the image as a Live Overlay asset.

8. Selecting a separate AI garment reference image.



Do not assume background removal alone makes every product suitable for Live Try-On.



Add an image validation step.



Show warnings when a garment image is unsuitable.



For example:



- Background not removed.

- Product not centered.

- Garment is cropped.

- Image resolution too low.

- Garment orientation is unsuitable.



Allow manual correction and approval.



Never overwrite original uploaded images.



Keep original, processed, and AI reference images separate.



Bulk Product Upload



Support uploading multiple products in one operation.



Provide a review screen before saving.



Allow editing names, categories, prices, and sizes before importing.



Avoid requiring the store owner to enter every field individually when bulk upload is used.



7. Clothing Catalog



Build a product catalog that reads real products from Supabase.



Include:



- Search.

- Categories.

- Filters.

- Colors.

- Sizes.

- Price.

- Product thumbnails.

- Product availability.



Selecting a product updates the Live Try-On engine.



Support combining tops and bottoms.



Show a helpful warning if a selected product does not have a compatible Live Overlay image.



Allow AI Try-On if an appropriate AI reference image exists.



8. AI Virtual Try-On



Integrate FASHN AI through Supabase Edge Functions.



Initial model:



tryon-v1.6



Endpoint:



POST https://api.fashn.ai/v1/run



Use secure backend authentication.



Store the API key in Supabase Secrets:



FASHN_API_KEY



Never expose API credentials in frontend code.



The frontend sends:



- Customer image.

- Selected product identifier.

- Consent confirmation.



The Edge Function retrieves the corresponding AI garment image from the product record and submits the request.



Use:



- category: tops for upper-body garments.

- category: bottoms for trousers.

- category: one-pieces for full outfits where supported.

- mode: balanced.

- num_samples: 1.



Implement the actual prediction lifecycle:



- Request submission.

- Prediction ID.

- Status polling.

- Completion.

- Failure handling.

- Timeout handling.



Do not use mock results when the API is unavailable.



Customer images must not be saved permanently by default.



Only perform AI processing after explicit consent.



Keep Live Try-On operational during AI processing.



9. Admin Dashboard



Create a complete Arabic-first RTL administration dashboard.



Pages:



1. Overview.

2. Products.

3. Add Product.

4. Bulk Upload.

5. Categories.

6. Inventory.

7. Image Processing.

8. Try-On Sessions.

9. AI Usage.

10. Settings.



Use a premium, modern fashion retail design.



Make product management easy for a non-technical shop owner.



Support Arabic and English.



10. Supabase Database



Create tables:



- stores

- profiles

- categories

- products

- product_images

- fitting_sessions

- ai_tryon_jobs



The product_images table should support:



- product_id

- image_type

- storage_path

- image_url

- is_primary

- processing_status

- created_at



Supported image types:



- original

- catalog

- live_overlay

- ai_reference

- processed



Support multiple images per product.



Implement store-based multi-tenancy.



Implement Row Level Security.



Protect store data.



Do not store customer photos permanently by default.



11. Storage



Create storage buckets:



- product-originals

- product-catalog

- garment-overlays

- ai-references

- temporary-ai-results



Organize product assets by store ID and product ID.



Preserve original images.



Use suitable access policies.



Do not expose private customer images through public URLs.



12. PWA Requirements



Implement:



- Web app manifest.

- App icons.

- Installable experience on supported platforms.

- Standalone display mode.

- Responsive layouts.

- Offline access to the application shell.

- Local caching of non-sensitive assets where appropriate.



Do not cache personal customer camera images.



Do not claim camera functionality works offline if the browser or device cannot support the required features.



13. Privacy



- Camera permission must be explicit.

- Show when the camera is active.

- No video recording.

- No facial identity recognition.

- No permanent customer image storage by default.

- Explicit consent before sending photos to external AI services.

- Clear temporary image data.

- Stop camera streams when the session ends.

- Automatic session timeout.

- End Session button.



14. Demo Mode



Allow testing without external API credentials.



Use sample clothing products.



Allow real camera access where available.



Allow real body detection.



Allow testing the Live Overlay engine.



If FASHN is not configured, show an honest configuration warning.



Never simulate a successful AI result.



15. Development Phases



PHASE 1:



- Responsive project setup.

- PWA configuration.

- Camera manager.

- Mobile and desktop camera testing.

- MediaPipe body detection.



PHASE 2:



- Live clothing overlay.

- Mesh deformation.

- Landmark smoothing.

- Basic occlusion.



PHASE 3:



- Product management.

- Image uploads.

- Multiple product images.

- Background removal workflow.

- Live Overlay image preparation.

- Bulk uploads.



PHASE 4:



- AI Try-On integration.

- FASHN API.

- AI result display.

- Comparison interface.



PHASE 5:



- Admin dashboard.

- Inventory.

- Session analytics.

- Security.

- Performance optimization.

- Cross-device testing.



16. Acceptance Criteria



The MVP must be tested on:



- Android mobile browser.

- Android tablet browser.

- Desktop Chrome.

- Laptop webcam.

- USB webcam.

- A large TV browser or external monitor setup where supported.



Verify:



1. Camera works on each supported device.

2. Camera switching works where supported.

3. Full-body detection works.

4. Live tracking responds to movement.

5. Uploaded store products appear in the catalog.

6. Original images are preserved.

7. Product image processing works.

8. Live Overlay uses the processed garment image.

9. AI Try-On uses the correct product image.

10. AI processing uses a real API response.

11. Mobile and desktop layouts are independently optimized.

12. No customer photos are stored permanently by default.

13. Admin data is protected.



Do not mark any feature complete unless implemented and tested.



17. Final Instructions



Start by inspecting the project and setting up the core architecture.



Build the real application, not a static design prototype.



Prioritize a functional camera and body tracking before secondary dashboard features.



Do not skip product upload functionality.



The store owner's ability to upload and manage their own actual clothing inventory is a core requirement, not a future feature.



Keep the architecture modular and scalable so the same platform can later serve multiple clothing stores.



At the end of every development phase, report:



- What is implemented.

- What is actually working.

- What needs API credentials.

- What needs hardware testing.

- What remains incomplete.



The final product must be one cross-platform Hybrid Virtual Fitting Room that works across mobile, tablet, desktop, and TV-compatible browsers.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cf3544c1-77a5-4df5-a9ee-e57389a43d25).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
