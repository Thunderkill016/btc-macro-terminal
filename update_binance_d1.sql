UPDATE user_profiles 
SET binance_api_key = 'jsHz1tDJKiCm8meVqtqYLVHA8uWlxzgATUyZZPBnesk72yJ3yacCa7kbdsmUOraI', 
    binance_api_secret = 'VCpwmDDdg1sRnnNWphAdmJG4SosPp6YslWCcnz0ITKYU3gcbn88yPqX2CVu1iSWm', 
    updated_at = 1794138000000;

INSERT OR REPLACE INTO user_profiles (telegram_chat_id, lang, monthly_budget, min_confluence_score, max_mempool_fee, binance_api_key, binance_api_secret, updated_at) 
VALUES ('system_default', 'vi', 500, 75, 10, 'jsHz1tDJKiCm8meVqtqYLVHA8uWlxzgATUyZZPBnesk72yJ3yacCa7kbdsmUOraI', 'VCpwmDDdg1sRnnNWphAdmJG4SosPp6YslWCcnz0ITKYU3gcbn88yPqX2CVu1iSWm', 1794138000000);
