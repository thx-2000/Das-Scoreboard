<?php

require_once __DIR__ . '/includes/session.php';

scoreboard_session_start();

$_SESSION = [];
session_destroy();

header('Location: /login.php');
exit;
