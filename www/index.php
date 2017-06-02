<!DOCTYPE html>
<html>
<head lang="en">
  <meta charset="UTF-8">
  <title>ZeRobot - 首页</title>
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
    <h3>导航 - <?php echo $_SERVER['SERVER_ADDR'] ?></h3>
    <hr>
    <div><a href="input.php">验证码录入</a> | <a href="actLog.php">操作日志</a> | <a href="user.php">账户设置</a> | <a href="strategy.php">策略设置</a> | <a href="stat.php">平台待收</a></div>
    <hr>
    <script>var dt=new Date();document.write('<p>© '+dt.getFullYear()+' Jimwei </p>');</script>
  </div>
</div>
</body>
</html>

