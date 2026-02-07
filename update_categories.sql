-- 1. Transformar 'Latão 473ml' em 'Latas'
UPDATE products 
SET category = 'Latas' 
WHERE category = 'Latão 473ml';

-- 2. Na categoria 'Long Neck / Latão', separar o que é Latão
UPDATE products
SET category = 'Latas'
WHERE category = 'Long Neck / Latão' 
  AND (name ILIKE '%Latão%' OR volume ILIKE '%473%');

-- 3. O restante de 'Long Neck / Latão' vira 'Long Neck'
UPDATE products
SET category = 'Long Neck'
WHERE category = 'Long Neck / Latão';
