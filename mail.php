<?php
declare(strict_types=1);
use PHPMailer\PHPMailer\PHPMailer;
require_once __DIR__ . '/form-common.php';
$data = request_data();
require_once __DIR__ . '/phpmailer/src/Exception.php';
require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/phpmailer/src/SMTP.php';
$mail = new PHPMailer(true);
$mail->CharSet = 'UTF-8'; $mail->isSMTP();
$mail->Host = configured('SMTP_HOST'); $mail->SMTPAuth = true;
$mail->Username = configured('SMTP_USERNAME'); $mail->Password = configured('SMTP_PASSWORD');
$mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; $mail->Port = 465; $mail->Timeout = 15;
try {
 $mail->setFrom(configured('SMTP_FROM')); $mail->addAddress(configured('SMTP_TO'));
 $mail->addReplyTo($data['user_email'], $data['user_name']); $mail->Subject = 'Новая заявка';
 $mail->Body = "Имя: {$data['user_name']}\nТелефон: {$data['user_phone']}\nEmail: {$data['user_email']}";
 $mail->send();
} catch (Throwable $e) { error_log('ASK: SMTP delivery failed'); fail_request(502, 'Заявка не отправлена. Попробуйте позже или позвоните нам.'); }
success_response();
