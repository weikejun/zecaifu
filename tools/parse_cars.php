<?php

if ($argc < 2) {
	echo 'Usage: ' . basename(__FILE__) . ' [FILE]';
	exit;
}

$ret = json_decode($argv[1], true);

if($ret['data']['borrow']['totalItems'] > 0) {
	$cars = $ret['data']['borrow']['borrowList'];
	foreach($cars as $idx => $info) {
		preg_match_all('/第([0-9]+)/', $info['borrowName'], $matches);
		echo $info['sid'] . '_' . $matches[1][0] . " ";
	}
}
