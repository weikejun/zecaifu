<?php

$dir = dirname(__FILE__);
if(isset($_GET['captcha'])) {
	foreach($_GET['captcha'] as $fname => $capVal) {
	echo ("$dir/captcha/$fname".'.res');
		if(trim($capVal) === "") continue;
		file_put_contents("$dir/captcha/$fname".'.res', $capVal);
	}
}

echo 'ok';
