<?php

/**
 * Punkteformel fuer RAGE (siehe README): pro tatsaechlichem Stich +1 Punkt,
 * +10 wenn Ansage und tatsaechliche Stiche uebereinstimmen, sonst -5.
 * Rage-Bonus-Karten geben je +5, Rage-Rache-Karten je -5 - unabhaengig von
 * der Stichzahl.
 */
function compute_rage_points(int $bid, int $actualTricks, int $rageBonusCount, int $rageRacheCount): int
{
    $points = $actualTricks;
    $points += ($bid === $actualTricks) ? 10 : -5;
    $points += 5 * $rageBonusCount;
    $points -= 5 * $rageRacheCount;
    return $points;
}

/** Karten (= maximal moegliche Stiche) fuer eine RAGE-Rundennummer (1-10). */
function rage_cards_for_round(int $roundNumber): int
{
    return max(0, 11 - $roundNumber);
}
