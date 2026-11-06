<script lang="ts">
  import type { Entity, Identifiable } from '$lib/types';
  import LibraryEntry from '../LibraryEntry.svelte';
  import SceneDialog from '../SceneDialog.svelte';
  import SidebarSection from '../SidebarSection.svelte';
  import { addScene as addSceneToMat, getPlaymat } from '../playmat';
  import { getScenes } from './scenes';

  let sceneDialog: SceneDialog | undefined = $state();
  let scenes = getScenes();
  const mat = getPlaymat();
  function add(scene: Entity) {
    addSceneToMat(mat, scene);
  }

  async function newScene() {
    const s = await sceneDialog?.getNew();
    if (s) {
      scenes.appendItem(s);
    }
  }

  async function editScene(scene: Entity) {
    const s = await sceneDialog?.edit(scene);
    if (s) {
      scenes.updateItem(s);
    }
  }

  function remove(item: Identifiable) {
    if (item) {
      scenes.removeItem(item.id);
    }
  }
</script>

<svelte:head>
  <title>Scenes :: Brighter Worlds Online</title>
</svelte:head>
<SceneDialog bind:this={sceneDialog} ondelete={remove} />
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom Scenes" addable onclick={newScene} open>
    {#each scenes.items as scene (scene.id)}
      <LibraryEntry
        name={scene.name}
        kind="scene"
        onedit={() => editScene(scene)}
        onadd={() => add(scene)}
        ondelete={() => remove(scene)}
      />
    {/each}
  </SidebarSection>
</div>
