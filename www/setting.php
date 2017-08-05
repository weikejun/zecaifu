<!DOCTYPE html>
<html>
<head lang="en">
  <meta charset="UTF-8">
  <title>ZeRobot - 系统参数</title>
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
    <h3>系统参数 - <?php echo $_SERVER['SERVER_ADDR'] ?></h3>
    <hr>
    <form id="sub_form" method="post" class="am-form">
<?php
$file = dirname(dirname(__FILE__)).'/config/system.dat';
$systemStr = '';
if($_POST['systems']) {
	$output = file_put_contents($file, trim($_POST['systems']));
	$systemStr = trim($_POST['systems']);
	echo "<script>alert('".($output !== false ? "success" : "failed")."');location.href = location;</script>";
}
else {
	$lines = null;
	if(file_exists($file)) {
		$lines = file($file);
	}
	foreach($lines as $line) {
		$line = trim($line);
		$systemStr .= $line."\n";
	}
} 
?>
<textarea style="height:75px" autocomplete="off" name="systems" id="systems"><?php echo htmlspecialchars($systemStr); ?></textarea>
      <br>
      <div class="am-cf">
        <input type="submit" name="" value="提 交" class="am-btn am-btn-primary am-btn-sm am-fl">&nbsp;&nbsp;<a href="./">返回</a>
      </div>
    </form>
    <hr>
    <script>var dt=new Date();document.write('<p>© '+dt.getFullYear()+' Jimwei </p>');</script>
  </div>
</div>
</body>
</html>
