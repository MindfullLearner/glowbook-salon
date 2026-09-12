<?php
/**
 * ONE-TIME USE FILE.
 * Run this once (open it in your browser) to get a correct password hash
 * for your PHP version, then paste that hash into the `users` table
 * for the admin row (replace the password column value).
 *
 * After you've generated your hash and updated the database, DELETE this file.
 */

$plainPassword = "Admin@123";
$hash = password_hash($plainPassword, PASSWORD_DEFAULT);

echo "Plain password: " . $plainPassword . "<br>";
echo "Hashed password (copy this into the database): <br>";
echo $hash;
