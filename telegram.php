<?php
declare(strict_types=1);
require_once __DIR__ . '/form-common.php';
$data = request_data();
$token = configured('TELEGRAM_BOT_TOKEN');
$chat = configured('TELEGRAM_CHAT_ID');
if (!extension_loaded('curl') || !preg_match('/^[0-9]+:[A-Za-z0-9_-]+$/', $token)) fail_request(503, 'Отправка временно недоступна.');
$text = "Новая заявка\nИмя: {$data['user_name']}\nТелефон: {$data['user_phone']}\nEmail: {$data['user_email']}";
$curl = curl_init('https://api.telegram.org/bot' . $token . '/sendMessage');
curl_setopt_array($curl, [CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>http_build_query(['chat_id'=>$chat, 'text'=>$text], '', '&', PHP_QUERY_RFC3986), CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>15, CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS]);
$response = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$result = is_string($response) ? json_decode($response, true) : null;
if ($status !== 200 || !is_array($result) || ($result['ok'] ?? false) !== true) { error_log('ASK: Telegram failed; HTTP ' . $status); fail_request(502, 'Заявка не отправлена. Попробуйте позже или позвоните нам.'); }
success_response();
