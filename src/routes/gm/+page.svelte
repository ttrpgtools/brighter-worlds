<script>
  import SidebarSection from './SidebarSection.svelte';
</script>
<svelte:head>
  <title>GM Tools :: Brighter Worlds Online</title>
</svelte:head>
<div class="flex flex-col gap-4">
  <SidebarSection title="Rules of Combat">
    <div id="rules-of-combat" class="prose dark:prose-invert prose-sm prose-h1:font-subtitle">
      <h2 id="rounds-and-initiative">
        Rounds and Initiative
      </h2>
      <p>
        When engaging in combat time is tracked in increments called Rounds.
        A Round lasts about 10 seconds, or enough time for someone to run
        across a room and perform one significant action.
      </p>
      <p>
        During a Round, each side of a conflict acts together. Each
        individual on a side can act in whatever order they choose, and can
        move about 40 feet, and perform one significant action (make an
        attack, use an item, cast a spell, etc.).
      </p>
      <p>
        Any actions that carry risk require a Save as usual, usually against
        the creature you’re engaged with.
      </p>
      <p>
        If it’s not clear which side should act first, make a DEX Save vs
        the opposition to act before them.
      </p>
      <h2 id="attacking">
        Attacking
      </h2>
      <p>
        To make an attack, roll your weapon’s damage die. The target of the
        attack subtracts their armor and reduces their Grit by the
        remainder. If there is no excess damage, the target was able to
        avoid or otherwise defend against the attack. If there is more
        damage dealt than the remaining Grit, the excess damage becomes
        Direct Damage.
      </p>
      <p>
        Direct Damage represents the attack making physical contact with the
        target, and causes a STR Save to avoid Critical Damage.
      </p>
      <h2 id="critical-damage-save">
        Critical Damage Save
      </h2>
      <p>
        After receiving Direct Damage, make a STR Save and roll higher than
        that amount to avoid Critical Damage.
      </p>
      <p>
        If you suffer multiple attacks simultaneously, make your Save
        against their combined Direct Damage, rather than making separate
        Saves. Armor still applies to each attack individually.
      </p>
      <h2 id="critical-damage">
        Critical Damage
      </h2>
      <p>
        If you suffer Critical Damage, step down your STR and suffer any
        Critical Damage effects from your attackers.
      </p>
      <p>
        If your STR steps down below a d4 (zero STR) you become
        <em>incapacitated</em>. An <em>incapacitated</em> creature can only
        weakly crawl, and will die in an hour without assistance. First aid
        from an ally gets you back on your feet, but doesn’t restore your
        STR.
      </p>
      <p>
        Taking Direct Damage, or trying to step down your die at zero STR is
        lethal.
      </p>
      <h2 id="overflow-damage">
        Overflow Damage
      </h2>
      <p>
        If the amount of Direct Damage you received is equal to or greater
        than the highest value on your STR die, immediately suffer Critical
        Damage. If the damage in excess of that amount is still equal to or
        greater than your now lowered STR die, repeat. If it is lower, make
        a Critical Damage Save as usual trying to roll higher the remaining
        damage.
      </p>
      <p>
        If your STR steps below a d4 during this process, you become
        incapacitated and ignore any remaining damage.
      </p>
      <h2 id="attack-modifiers">
        Attack Modifiers
      </h2>
      <p>
        If you make an attack that is at an advantage (against an
        unsuspecting target, from higher ground, etc.) it is
        <em>enhanced</em>. Roll a d12 in addition to your other dice, and
        keep only the highest result.
      </p>
      <p>
        If you attack while disadvantaged (through cover, while blind,
        unarmed, etc.) it is <em>impaired</em>. Roll a d4 instead of your
        other dice.
      </p>
      <h2 id="blast">
        Blast
      </h2>
      <p>
        Attacks with the <em>blast</em> quality affect all targets in the
        area. This can refer to actual explosions, fireballs, whirling
        blades, or to a giant swinging a club in a wide arc.
      </p>
      <h2 id="morale-saves">Morale Saves</h2>
      <p>
        When an NPC faces daunting, terrifying, or dangerous situations they
        should make a WIL Save to avoid surrender or flight.
      </p>
      <p>
        NPCs make Morale Saves the first time they take Critical Damage, the
        first time one of their companions is incapacitated or killed, or if
        the tide of battle turns against them.
      </p>
      <p>
        Morale Saves are also made when an NPC is presented with a situation
        dramatically outside their understanding, or hirelings being asked
        to put themselves at significant risk.
      </p>
      <p>
        A Morale Save might be <em>enhanced</em> due to a courageous leader,
        the promise of significant reward, or being particularly oblivious.
        It might be <em>impaired</em> due to being directly threatened, a
        hopeless situation, or the obvious evidence of immediate danger.
      </p>
    </div>
  </SidebarSection>
</div>