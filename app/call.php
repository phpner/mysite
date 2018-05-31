<?php
setlocale(LC_ALL, 'ru_RU.UTF-8');

$json_str = file_get_contents('php://input');

/*$json_data  = json_decode($json_str);

$name  =  $_REQUEST['name'] ;
$email = $_REQUEST["phone"] ;

$title = (!empty($_REQUEST["is_popup"])) ? "Форма заказа чераз попап" : '' ; */

/*$time = date("F j, Y, g:i a");

$to  = "phpner@gmail.com";

$subject = "$title";

$message = " <p>Форма заказа $title  </p> </br><p>Имя покупателя  $name </p> </br> <b> Телефон $email </br> <p> Время заказа : $time </p>";

$headers  = "Content-type: text/html; charset=utf-8 \r\n"; //Кодировка письма
$headers .= "From: Отправитель from@example.com\r\n"; //Наименование и почта
$headers .= "Reply-To: reply-to: form@example.com\r\n";

mail($to, $subject, $message, $headers);*/
/*
$re = json_encode([result => 1,name => $name, emil => $email,msg => $msg]) ;*/

var_dump($_REQUEST);

?>