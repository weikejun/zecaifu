<!DOCTYPE html>
<html>
<head lang="en">
  <meta charset="UTF-8">
  <title>ZeRobot - 策略设置</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no">
  <meta name="renderer" content="webkit">
  <meta http-equiv="Cache-Control" content="no-siteapp" />
  <link rel="alternate icon" type="image/png" href="/i/favicon.png">
  <link rel="stylesheet" href="css/amazeui.min.css"/>
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
    <h3>策略设置</h3>
    <hr>
    <form id="sub_form" method="post" class="am-form">
<?php
$file = dirname(dirname(__FILE__)).'/config/strategy.dat';
$userStr = '';
if($_POST['strategys']) {
	$output = file_put_contents($file, trim($_POST['strategys']));
	$strategyStr = trim($_POST['strategys']);
	echo "<script>alert('".($output !== false ? "success" : "failed")."');location.href = location;</script>";
}
else {
	$lines = null;
	if(file_exists($file)) {
		$lines = file($file);
	}
	foreach($lines as $line) {
		$line = trim($line);
		$strategyStr .= $line."\n";
	}
} 
?>
      <textarea autocomplete="off" name="strategys" id="strategys"><?php echo htmlspecialchars($strategyStr); ?></textarea>
      <br>
      <div class="am-cf">
        <input type="submit" name="" value="提 交" class="am-btn am-btn-primary am-btn-sm am-fl">
      </div>
    </form>
    <hr>
    <p>© 2016 Jimwei </p>
  </div>
</div>
</body>
</html>
