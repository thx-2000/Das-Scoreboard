<?php

require_once __DIR__ . '/../includes/state.php';

$version = trim(file_get_contents(__DIR__ . '/../VERSION'));
send_json(['version' => $version]);
