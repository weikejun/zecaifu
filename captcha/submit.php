<!DOCTYPE html>
<html>
<head lang="en">
  <meta charset="UTF-8">
  <title>验证码提交</title>
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
    <h3>验证码提交</h3>
    <hr>
<?php
$dir = dirname(__FILE__);
echo '<pre>';
if(isset($_POST['captcha'])) {
	foreach($_POST['captcha'] as $fname => $capVal) {
		if(trim($capVal) === "") continue;
		file_put_contents($fname.'.res', $capVal);
		echo date('Ymd H:i:s').' Create file '.$fname.".res, <img src='$fname.gif' /> $capVal\n";
	}
} else {
	echo 'no captcha submit';
}
echo '</pre><a href="actLog.php">查看日志</a>&nbsp;&nbsp;<a href="input.php">重新输入</a>';
?>
    <hr>
    <p>© 2016 Jimwei </p>
  </div>
</div>
</body>
</html>

