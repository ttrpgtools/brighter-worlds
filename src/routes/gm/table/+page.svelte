<script lang="ts">
  import { getEncounters, getNpcInstance } from '$lib/data/encounter-manager';
  import type {
    Cta,
    CustomRolltableDef,
    DieValue,
    DiscordEmbed,
    MatAddable,
    RolltableOption,
    TableRoll,
  } from '$lib/types';
  import { isEncounter, isNpc } from '$lib/util/validate';
  import CustomRolltable from '../CustomRolltable.svelte';
  import SidebarSection from '../SidebarSection.svelte';
  import RolltableDialog from '../RolltableDialog.svelte';
  import {
    addEncounter,
    addItem,
    addNpc,
    addScene,
    addLocalRoll,
    getPlaymat,
    getRollLog,
    addRemoteRoll,
    addPayload,
    getAddableFromTableRoll,
  } from '../playmat';
  import type { PageData } from './$types';
  import { getNpcs } from '../bestiary/npcs';
  import { getRelics } from '../reliquary/relics';
  import { addTable, getTables, removeTable, updateTable } from './tables';
  import Icon from '$lib/ui/icon.svelte';
  import { id } from '$lib/rolling/id';
  import { rollRequests, rollResponses } from '../gmtools';
  import {
    ENCOUNTER_ROLL_NO,
    ENCOUNTER_ROLL_SIGNS,
    ENCOUNTER_ROLL_YES,
    REACTION_ROLL_NEG,
    REACTION_ROLL_NEUTRAL,
    REACTION_ROLL_POS,
    REACTION_ROLL_VNEG,
    REACTION_ROLL_VPOS,
  } from '$lib/const';
  import {
    formatEncounterRoll,
    formatTravelEncounterRoll,
    formatTravelRoll,
  } from '$lib/util/share';
  import { onMount } from 'svelte';
  import Friends from './Friends.svelte';
  import TravelRolls from './TravelRolls.svelte';
  import type { FriendRollResult, FriendSlot } from './friend-state.svelte';
  import {
    d6,
    encounterActivities,
    isFriendResult,
    rollTravel,
    type EncounterInfo,
    type TravelResult,
  } from './hexcrawl';
  import { weather } from './weather.svelte';
  import { defined } from '$lib/util/array';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const bestiary = getNpcs();
  let allNpcs = $derived(data.npcs.concat(bestiary.items));
  const relicList = getRelics();
  const encounters = getEncounters();

  let tableDialog: RolltableDialog | undefined = $state();

  const encounterOpts: RolltableOption[] = [
    { type: 'text', value: ENCOUNTER_ROLL_YES, trigger: 1 },
    { type: 'text', value: ENCOUNTER_ROLL_SIGNS, trigger: [2, 3] },
    { type: 'text', value: ENCOUNTER_ROLL_NO, trigger: [4, 6] },
  ];

  const reactionOpts: RolltableOption[] = [
    { type: 'text', value: REACTION_ROLL_VPOS, trigger: [2, 3] },
    { type: 'text', value: REACTION_ROLL_POS, trigger: [4, 6] },
    { type: 'text', value: REACTION_ROLL_NEUTRAL, trigger: 7 },
    { type: 'text', value: REACTION_ROLL_NEG, trigger: [8, 10] },
    { type: 'text', value: REACTION_ROLL_VNEG, trigger: [11, 12] },
  ];

  let encounterTable: CustomRolltable | undefined = $state();
  let reactionTable: CustomRolltable | undefined = $state();
  let friendsTool: Friends | undefined = $state();
  const customTables: Record<string, CustomRolltable> = $state({});

  let mat = getPlaymat();
  let log = getRollLog();

  let tables = getTables();

  onMount(() => {
    const unsub = rollResponses.subscribe(({ id, result }) => {
      if (customTables[id]) {
        customTables[id].rollTable(result);
      }
    });
    return () => unsub();
  });

  function getRollResult(roll: TableRoll<RolltableOption>) {
    const first = roll.value[0];
    return {
      result: roll.roll,
      dice: roll.dice ?? [],
      label: `${roll.title}: ${first.type === 'text' ? first.value : first.value.name}`,
    };
  }

  function addOption(roll: TableRoll<RolltableOption>) {
    if (!roll.value.length) return;
    const first = roll.value[0];
    addLocalRoll(log, getRollResult(roll));
    if (first.type === 'entity') {
      const ent = first.value;
      if (isNpc(ent)) {
        const inst = getNpcInstance(ent);
        addNpc(mat, inst);
      } else if (isEncounter(ent)) {
        addEncounter(mat, ent);
      } else {
        addItem(mat, ent);
      }
    }
  }

  function addRemote(embed: DiscordEmbed) {
    addRemoteRoll(log, { embed });
  }

  function addLoggedRoll(label: string, result: number, dice: DieValue[] = []) {
    addLocalRoll(log, {
      result,
      dice,
      label,
    });
  }

  function addFriendRoll(roll: FriendRollResult, noMat: boolean) {
    addLoggedRoll(`Friend Die: ${roll.friend?.name ?? `empty slot ${roll.roll}`}`, roll.roll, [
      roll.die,
    ]);
    if (roll.friend != null && !noMat) {
      addFriendToPlaymat(roll.friend);
    }
  }

  function getFriendAddable(friend: FriendSlot) {
    const npc = friend.sourceNpcId
      ? allNpcs.find((current) => current.id === friend.sourceNpcId)
      : undefined;
    if (npc) {
      const instance = getNpcInstance(npc);
      if (instance.name !== friend.name) {
        instance.name += ` (${friend.name})`;
      }
      return { kind: 'npc', payload: instance } satisfies MatAddable;
    }
    return {
      kind: 'scene',
      payload: {
        id: id(),
        name: friend.name,
        desc: friend.notes || '',
        icon: 'user',
      },
    } satisfies MatAddable;
  }

  function addFriendToPlaymat(friend: FriendSlot | undefined) {
    if (!friend) return;
    addPayload(mat, getFriendAddable(friend));
  }

  async function rollFriendFromTravel() {
    return await friendsTool?.rollFriend(true);
  }

  function travelEncounterContext(travel: TravelResult) {
    if (travel.encounter) return 'Here and now';
    if (travel.activityDie === 1) return 'Recent activity';
    if (travel.activityDie === 2) return 'Nearby activity';
    return '';
  }

  function shouldRollTravelEncounter(travel: TravelResult) {
    return travel.encounter || travel.activityDie === 1 || travel.activityDie === 2;
  }

  function rollLabel(roll: TableRoll<RolltableOption> | undefined) {
    if (!roll?.value.length) return '';
    const first = roll.value[0];
    return first.type === 'entity' ? first.value.name : first.value;
  }

  function addRollEntityToPlaymat(roll: TableRoll<RolltableOption> | undefined) {
    const addable = getAddableFromTableRoll(roll);
    if (addable) {
      addPayload(mat, addable);
    }
  }

  async function resolveFriendLabel(
    label: string,
  ): Promise<[string | undefined, FriendSlot | undefined]> {
    if (!isFriendResult(label)) return [undefined, undefined];
    const roll = await rollFriendFromTravel();
    return [roll?.friend?.name ?? label, roll?.friend];
  }

  async function addCustom() {
    const newTable = await tableDialog?.getNew();
    if (newTable) {
      addTable(tables, newTable);
    }
  }

  async function editTable(table: CustomRolltableDef) {
    const result = await tableDialog?.edit(table);
    if (result) {
      updateTable(tables, result);
    }
  }

  function remove(table: CustomRolltableDef) {
    removeTable(tables, table);
    delete customTables[table.id];
  }

  function requestRoll(table: CustomRolltableDef) {
    rollRequests.emit({ name: table.id, formula: table.formula });
  }

  async function fullEncounterRoll(table: CustomRolltableDef) {
    const encRoll = await encounterTable?.getResult();
    if (encRoll) {
      const type =
        encRoll.value.length > 0 && encRoll.value[0].type === 'text' ? encRoll.value[0].value : '';
      if (type === 'Nothing') {
        addRemote(formatEncounterRoll(type));
        return;
      }
      const [reactionRoll, roll] = await Promise.all([
        reactionTable?.getResult(),
        customTables[table.id].getResult(),
      ]);
      const reaction =
        reactionRoll && reactionRoll.value.length ? ` (${reactionRoll.value[0].value})` : '';
      if (roll && roll.value.length) {
        const res = roll.value[0];
        const label = res.type === 'entity' ? res.value.name : res.value;
        addRemote(formatEncounterRoll(type, reaction, label));
        if (res.type === 'entity') {
          const ent = res.value;
          if (isNpc(ent)) {
            const inst = getNpcInstance(ent);
            inst.name = `${inst.name}${reaction}`;
            addNpc(mat, inst);
          } else if (isEncounter(ent)) {
            const inst = { ...ent, id: id(), name: `${ent.name}${reaction}` };
            addEncounter(mat, inst);
          } else {
            addItem(mat, ent);
          }
        }
      }
    }
  }

  async function logEncounter(travel: TravelResult, enc: EncounterInfo) {
    const [result, friend] = await resolveFriendLabel(enc.subject);
    const [withResult, withFriend] = await resolveFriendLabel(enc.withSubject);

    const addables = [
      getAddableFromTableRoll(enc.tableRoll),
      getAddableFromTableRoll(enc.withRoll),
      friend ? getFriendAddable(friend) : undefined,
      withFriend ? getFriendAddable(withFriend) : undefined,
    ].filter(defined);
    const cta =
      addables.length && !travel.encounter
        ? ({
            id: id(),
            label: 'Add To Mat',
            type: 'addToMat',
            what: addables,
          } satisfies Cta)
        : undefined;
    console.log('CTA', cta);

    addRemote(
      formatTravelEncounterRoll({
        context: travelEncounterContext(travel),
        subject: enc.subject,
        activity: enc.activity,
        result,
        withSubject: enc.withSubject || undefined,
        withResult,
        cta,
        intensified: enc.intensified,
        roadRolls: enc.roadRolls,
      }),
    );

    if (travel.encounter) {
      addRollEntityToPlaymat(enc.tableRoll);
      addRollEntityToPlaymat(enc.withRoll);
      addFriendToPlaymat(friend);
      addFriendToPlaymat(withFriend);
    }
  }

  async function fullTravelRoll(table: CustomRolltableDef) {
    const travel = rollTravel(weather.upcoming);
    weather.upcoming = undefined;
    addRemote(formatTravelRoll(travel));

    if (travel.activityDie === 3) {
      weather.preroll();
      if (weather.upcoming) {
        addLoggedRoll(`Prerolled Weather: ${weather.upcomingLabel}`, weather.upcoming, [6]);
      }
    }

    if (!shouldRollTravelEncounter(travel)) return;

    const tableRoll = await customTables[table.id]?.getResult();
    const subject = rollLabel(tableRoll);
    if (!subject) return;

    const activityDie = d6();
    const activity = encounterActivities[activityDie - 1];
    const withRoll = activityDie === 6 ? await customTables[table.id]?.getResult() : undefined;
    const withSubject = rollLabel(withRoll);

    await logEncounter(travel, {
      subject,
      withSubject,
      tableRoll,
      withRoll,
      activity,
      intensified: false,
    });
  }
</script>

<svelte:head>
  <title>Tables :: Brighter Worlds Online</title>
</svelte:head>
<RolltableDialog
  bind:this={tableDialog}
  npcList={allNpcs}
  encList={encounters.list.items}
  relicList={relicList.items}
/>
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom Roll Tables" open addable onclick={addCustom}>
    {#each tables.items as table}
      <div class="relative group/table">
        <CustomRolltable
          options={table.options}
          title={table.name}
          formula={table.formula}
          onclick={() => editTable(table)}
          onroll={addOption}
          bind:this={customTables[table.id]}
        >
          {#snippet menu(closeMenu)}
            <div class="flex flex-col">
              <button
                type="button"
                onclick={() => (requestRoll(table), closeMenu())}
                class="px-3 py-2 text-left hover:bg-purple-100 dark:hover:bg-purple-950"
                >Request player roll</button
              >
              <button
                type="button"
                onclick={() => (fullEncounterRoll(table), closeMenu())}
                class="px-3 py-2 text-left hover:bg-purple-100 dark:hover:bg-purple-950"
                >Roll as dungeon encounter</button
              >
              <button
                type="button"
                onclick={() => (fullTravelRoll(table), closeMenu())}
                class="px-3 py-2 text-left hover:bg-purple-100 dark:hover:bg-purple-950"
                >Roll as travel encounter</button
              >
              <button
                type="button"
                onclick={() => (remove(table), closeMenu())}
                class="px-3 py-2 text-left text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950"
                >Delete table</button
              >
            </div>
          {/snippet}
        </CustomRolltable>
      </div>
    {/each}
  </SidebarSection>
  <SidebarSection title="Dungeon" open>
    <CustomRolltable
      options={encounterOpts}
      title="Dungeon Encounter Roll"
      formula="d6"
      onroll={addOption}
      bind:this={encounterTable}
    />
    <CustomRolltable
      options={reactionOpts}
      title="Reaction Roll"
      formula="2d6"
      onroll={addOption}
      bind:this={reactionTable}
    />
  </SidebarSection>

  <SidebarSection title="Hexcrawl" open>
    <TravelRolls
      onlog={addLoggedRoll}
      onencounter={logEncounter}
      onembed={addRemote}
      rollFriend={rollFriendFromTravel}
    />
    <Friends
      npcList={allNpcs}
      onroll={addFriendRoll}
      onadd={addFriendToPlaymat}
      bind:this={friendsTool}
    />
  </SidebarSection>
</div>
