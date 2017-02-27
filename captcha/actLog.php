<!DOCTYPE html>
<html>
<head lang="en">
  <meta charset="UTF-8">
  <title>融抢器 - 操作日志</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no">
  <meta name="renderer" content="webkit">
  <meta http-equiv="Cache-Control" content="no-siteapp" />
  <link rel="alternate icon" type="image/png" href="/i/favicon.png">
  <link rel="stylesheet" href="amazeui.min.css"/>
  <style>
    .header {
      text-align: center;
    }
    .header h1 {
      font-size: 200%;
      color: #333;
      margin-top: 30px;
    }
    .header p {
      font-size: 14px;
    }
  </style>
</head>
<body>
<div class="header">
  
  <hr />
</div>
<div class="am-g">
  <div class="am-u-lg-6 am-u-md-8 am-u-sm-centered">
    <h3>操作日志</h3>
    <hr>
<?php
$logDir = dirname(dirname(__FILE__))."/log";

$logFile = date("Ymd");

$lines = array_reverse(file("$logDir/$logFile"));

echo '<pre>';
foreach($lines as $line) {
	echo $line;
}
echo '</pre>';
?>
    <hr>
    <p>© 2016 Jimwei </p>
  </div>
</div>
</body>
</html>

