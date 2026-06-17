<?php $claim = App\Models\Claim::whereNotNull('decision_notes')->first(); echo $claim ? $claim->id : 'None';
