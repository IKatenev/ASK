<?php
declare(strict_types=1);
function fail_request(int $status, string $message): never {
 http_response_code($status); header('Content-Type: text/plain; charset=utf-8'); header('Cache-Control: no-store'); echo $message; exit;
}
function request_data(): array {
 if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); fail_request(405, 'Используйте форму на главной странице.'); }
 if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) fail_request(413, 'Слишком большой запрос.');
 $data = [];
 foreach (['user_name'=>200, 'user_email'=>254, 'user_phone'=>32] as $key=>$limit) {
  $v = $_POST[$key] ?? null;
  if (!is_string($v) || !preg_match('//u', $v) || strlen(trim($v)) > $limit || trim($v) === '' || preg_match('/[\x00-\x1F\x7F]/', $v)) fail_request(422, 'Проверьте имя, email и телефон.');
  $data[$key] = trim($v);
 }
 if (!filter_var($data['user_email'], FILTER_VALIDATE_EMAIL) || !preg_match('/^\+?[0-9() \-]+$/', $data['user_phone'])) fail_request(422, 'Проверьте email и телефон.');
 $digits = preg_replace('/\D/', '', $data['user_phone']);
 if (!preg_match('/^[78][0-9]{10}$/', $digits)) fail_request(422, 'Введите полный номер с кодом +7.');
 $data['user_phone'] = '+7' . substr($digits, 1);
 if (!empty($_POST['website'])) fail_request(422, 'Не удалось отправить заявку.');
 $path = sys_get_temp_dir() . '/ask-form-' . hash('sha256', __DIR__ . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
 $file = @fopen($path, 'c+');
 if (!$file || !flock($file, LOCK_EX)) fail_request(503, 'Сервис временно недоступен.');
 $last = (int)stream_get_contents($file);
 if (time() - $last < 60) { flock($file, LOCK_UN); fclose($file); header('Retry-After: 60'); fail_request(429, 'Повторную заявку можно отправить через минуту.'); }
 ftruncate($file, 0); rewind($file); fwrite($file, (string)time()); fflush($file); flock($file, LOCK_UN); fclose($file);
 return $data;
}
function configured(string $key): string {
 $v = getenv($key);
 if ($v === false || trim($v) === '') { error_log('ASK: missing configuration ' . $key); fail_request(503, 'Отправка временно недоступна. Свяжитесь с нами по телефону.'); }
 return trim($v);
}
function success_response(): never { header('Cache-Control: no-store'); header('Location: thank-you.html', true, 303); exit; }
