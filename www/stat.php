<!DOCTYPE html>
<html>
<head lang="en">
  <meta charset="UTF-8">
  <title>ZeRobot - 待收汇总</title>
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
    <h3>待收汇总 - <?php echo $_SERVER['SERVER_ADDR'] ?></h3>
    <hr>
    <div>
<?php
	echo "<pre>";
	$recs = file(dirname(__FILE__).'/../data/summary');
	if (!$recs) {
		echo "暂无统计";
	}
	$result = [];
	foreach($recs as $idx => $rec) {
		$recDetail = explode('|',$rec);
		$result['summary'][$recDetail[0]][$recDetail[1]] += $recDetail[3];
		$result['summary'][$recDetail[0]]['total'] += $recDetail[3];
	}
	krsort($result['summary']);
	foreach($result['summary'] as $date => $amount) {
		echo "<a href='statDetail.php?date=$date'>$date</a> 总计：\t".$amount['total']."，车：".$amount['car']." 房：".$amount['house']." 车位：".$amount['parking']."\n";
	}
	echo "</pre>";
?>
    </div>
    <hr>
    <script>var dt=new Date();document.write('<p>© '+dt.getFullYear()+' Jimwei </p>');</script>
  </div>
</div>
</body>
</html>

