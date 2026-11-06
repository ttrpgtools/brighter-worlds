<script>
  import SidebarSection from './SidebarSection.svelte';
</script>

<svelte:head>
  <title>GM Tools :: Brighter Worlds Online</title>
</svelte:head>
<div class="flex flex-col gap-4">
  <SidebarSection title="Rules of Combat">
    <div id="rules-of-combat" class="prose dark:prose-invert prose-sm prose-h1:font-subtitle">
      <h2 id="rounds-and-initiative">Rounds and Initiative</h2>
      <p>
        When engaging in combat time is tracked in increments called Rounds. A Round lasts about 10
        seconds, or enough time for someone to run across a room and perform one significant action.
      </p>
      <p>
        During a Round, each side of a conflict acts together. Each individual on a side can act in
        whatever order they choose, and can move about 40 feet, and perform one significant action
        (make an attack, use an item, cast a spell, etc.).
      </p>
      <p>
        Any actions that carry risk require a Save as usual, usually against the creature you’re
        engaged with.
      </p>
      <p>
        The players’ side goes first each Round. If it’s not obvious that a player can act before
        the opposition, that player makes a DEX Save versus the opponent. Failure means they do not
        act during the first Round; success means they act first as usual.
      </p>
      <h2 id="attacking">Attacking</h2>
      <p>
        To make an attack, roll your weapon’s damage die. The target of the attack subtracts their
        armor and reduces their Grit by the remainder. If there is no excess damage, the target was
        able to avoid or otherwise defend against the attack. If there is more damage dealt than the
        remaining Grit, the excess damage becomes Direct Damage.
      </p>
      <h2 id="direct-damage">Direct Damage</h2>
      <p>
        Direct Damage represents an attack making actual contact. Most attacks affect STR; an
        attack’s description may instead specify DEX (entangling, slowing, paralyzing) or WIL
        (stunning, confusing, psychic).
      </p>
      <p>
        After receiving Direct Damage, make a Save with the affected Attribute and roll higher than
        the damage to avoid a Wound. Resolve each attack separately, applying Armor to each attack.
      </p>
      <p>
        This Save can be impaired by multiple attackers, a specific weakness, or other harmful
        circumstances. It can be enhanced by focusing on defense, resistance to the attack, or other
        beneficial circumstances.
      </p>
      <h2 id="wounds">Wounds</h2>
      <p>
        A Wound steps down the affected Attribute (usually STR) and applies any Wound effects from
        the attacker. If any Attribute drops below d4 to zero, the creature is
        <em>incapacitated</em>: it can only weakly crawl and will die in an hour without assistance.
        First aid from an ally gets it back on its feet without restoring Attributes.
      </p>
      <p>Direct Damage or a Wound to an Attribute already at zero results in death.</p>
      <h2 id="overflow-damage">Overflow Damage</h2>
      <p>
        If Direct Damage equals or exceeds the highest value on the affected die, immediately suffer
        a Wound. Resolve any excess against the lowered die using the same Direct Damage procedure.
        Damage that reaches an Attribute already at zero is lethal.
      </p>
      <h2 id="attack-modifiers">Attack Modifiers</h2>
      <p>
        If you make an attack that is at an advantage (against an unsuspecting target, from higher
        ground, etc.) it is
        <em>enhanced</em>. Roll a d12 in addition to your other dice, and keep only the highest
        result.
      </p>
      <p>
        If you attack while disadvantaged (through cover, while blind, unarmed, etc.) it is <em
          >impaired</em
        >. Roll a d4 instead of your other dice.
      </p>
      <h2 id="blast">Blast</h2>
      <p>
        Attacks with the <em>blast</em> quality affect all targets in the area. This can refer to actual
        explosions, fireballs, whirling blades, or to a giant swinging a club in a wide arc.
      </p>
      <h2 id="morale-saves">Morale Saves</h2>
      <p>
        When an NPC faces daunting, terrifying, or dangerous situations they should make a WIL Save
        to avoid surrender or flight.
      </p>
      <p>
        NPCs make Morale Saves the first time they suffer a Wound, the first time one of their
        companions is incapacitated or killed, or if the tide of battle turns against them.
      </p>
      <p>
        Morale Saves are also made when an NPC is presented with a situation dramatically outside
        their understanding, or hirelings being asked to put themselves at significant risk.
      </p>
      <p>
        A Morale Save might be <em>enhanced</em> due to a courageous leader, the promise of
        significant reward, or being particularly oblivious. It might be <em>impaired</em> due to being
        directly threatened, a hopeless situation, or the obvious evidence of immediate danger.
      </p>
      <h2 id="dual-wielding">Dual Wielding</h2>
      <p>
        When attacking one target with multiple weapons, roll all the weapons’ dice and keep the
        highest result. When splitting attacks between targets, roll separately for each; normally
        one or all of these attacks will be impaired by the difficulty of splitting your attention.
      </p>
      <h2 id="non-combat-damage">Non-Combat Damage</h2>
      <p>
        Outside combat, damage ignores Grit and directly causes a Wound. For example, failing a DEX
        Save to avoid a trap immediately steps down STR. Poison may instead call for a STR Save to
        resist it, with a Wound on failure.
      </p>
      <p>
        Read the full <a href="https://www.brighterworldsrpg.com/SRD/Combat.html">Combat rules</a>
        and <a href="https://www.brighterworldsrpg.com/SRD/HarmAndHealing.html">Harm and Healing</a>
        for more detail.
      </p>
    </div>
  </SidebarSection>
</div>
