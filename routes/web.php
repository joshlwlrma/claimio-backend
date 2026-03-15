<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

/* |-------------------------------------------------------------------------- | Local Storage File Server (Development Only) |-------------------------------------------------------------------------- | | PHP's built-in dev server does not follow Windows symlinks properly, | causing 403 Forbidden when accessing /storage/* via the symlink. | This route serves files directly from storage/app/public. | | In production (Nginx/Apache), the symlink works fine and this route | is never hit because the web server resolves the file first. | */
Route::get('/storage/{path}', function (string $path) {
    $disk = Storage::disk('public');

    if (!$disk->exists($path)) {
        abort(404);
    }

    return response()->file($disk->path($path));
})->where('path', '.*')->name('storage.serve');
