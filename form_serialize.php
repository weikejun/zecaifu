<?php

if ($argc < 2) {
	echo 'Usage: ' . basename(__FILE__) . ' [FILE]';
	exit;
}

$doc = new DOMDocument();
$doc->loadHTMLFile($argv[1]);
$nodes = $doc->getElementsByTagName("input");
$params = [];
foreach($nodes as $node) {
	if ($argv[2] == 'raw') {
		$params[] = $node->getAttribute('name') . "=" . $node->getAttribute('value');}
	else if ($argv[2] == 'decode') {
		$params[] = $node->getAttribute('name') . "=" . urldecode($node->getAttribute('value'));
	
	} else {
		$params[] = $node->getAttribute('name') . "=" . urlencode($node->getAttribute('value'));
	}
}

echo implode($params, "&");
