<?php

if ($argc != 2) {
	echo 'Usage: ' . basename(__FILE__) . ' [FILE]';
	exit;
}

$doc = new DOMDocument();
$doc->loadHTMLFile($argv[1]);
$nodes = $doc->getElementsByTagName("input");
$params = [];
foreach($nodes as $node) {
	$params[] = $node->getAttribute('name') . "=" . urlencode($node->getAttribute('value'));
}

echo implode($params, "&");
