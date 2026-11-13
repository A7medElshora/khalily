ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.products TO anon;
CREATE POLICY "Anyone can read active catalog products" ON public.products FOR SELECT TO anon USING (active = TRUE);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.categories TO anon;
CREATE POLICY "Anyone can read active catalog categories" ON public.categories FOR SELECT TO anon USING (active = TRUE);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.product_images TO anon;
CREATE POLICY "Anyone can read approved public catalog images" ON public.product_images FOR SELECT TO anon USING (image_type = 'catalog' AND processing_status = 'approved' AND EXISTS (SELECT 1 FROM public.products WHERE products.id = product_images.product_id AND products.active = TRUE));