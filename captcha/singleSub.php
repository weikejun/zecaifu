<?php

$dir = dirname(__FILE__);
if(isset($_GET['captcha'])) {
	foreach($_GET['captcha'] as $fname => $capVal) {
		if(trim($capVal) === "") continue;
		file_put_contents($fname.'.res', $capVal);
	}
}

echo 'ok';
