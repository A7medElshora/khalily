REVOKE ALL ON TABLE public.products FROM anon;
REVOKE ALL ON TABLE public.categories FROM anon;
REVOKE ALL ON TABLE public.product_images FROM anon;
DROP POLICY IF EXISTS "Anyone can read active catalog products" ON public.products;
DROP POLICY IF EXISTS "Anyone can read active catalog categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can read approved public catalog images" ON public.product_images;
CREATE OR REPLACE FUNCTION public.list_public_products()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  collection TEXT,
  price NUMERIC,
  discount_price NUMERIC,
  colors TEXT[],
  sizes TEXT[],
  stock_qty INTEGER,
  catalog_path TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.description, p.category, p.collection, p.price, p.discount_price,
         p.colors, p.sizes, p.stock_qty, p.main_image_path AS catalog_path
  FROM public.products p
  WHERE p.active = TRUE AND p.main_image_path IS NOT NULL
  ORDER BY p.created_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.list_public_products() TO anon, authenticated;