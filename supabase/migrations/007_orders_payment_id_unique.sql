-- iyzico_payment_id için UNIQUE kısıtı ve index
-- Aynı ödeme ID'si ile iki kez sipariş kaydedilmesini engeller (çift callback koruması)
ALTER TABLE orders
  ADD CONSTRAINT uq_orders_iyzico_payment_id UNIQUE (iyzico_payment_id);
