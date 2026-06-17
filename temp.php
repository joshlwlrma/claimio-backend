<?php $report = App\Models\Report::whereHas('images')->first(); $token = $report->user->createToken('test')->plainTextToken; echo 'TOKEN_OUT:' . $token . '|' . $report->id;
