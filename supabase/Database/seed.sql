-- AFTER creating auth users manually
INSERT INTO profiles (id,email,role)
VALUES
(auth.uid(),'admin@test.com','admin');

INSERT INTO practices (name, code)
VALUES ('More Life Medical', 'MLM');

INSERT INTO practice_settings (practice_id, address, phone, email)
SELECT id, '123 Main Road, Springs', '011 555 1234', 'info@morelife.co.za'
FROM practices WHERE code = 'MLM';
