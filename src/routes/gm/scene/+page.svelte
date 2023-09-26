<script lang="ts">
  import SidebarSection from "../SidebarSection.svelte";
  import { addScene, getPlaymat } from "../playmat";

  const mat = getPlaymat();
  function add() {
    addScene(mat, {
      id: 'demo-scene',
      name: 'Reception',
      desc: 'You approach the reception desk to find a skeleton working behind the desk. It looks up at you and in a feminine sing-song voice asks, "How may I assist you today?"',
      image: 'https://longrest.nyc3.digitaloceanspaces.com/scenes/reception.jpg',
      icon: 'nav-scenes'
    });
  }
</script>
<div class="flex flex-col gap-4">
  <SidebarSection title="Demo Scenes">
    <div>
      <button type="button" class="cursor-pointer" on:click={add}>Reception</button>
    </div>
  </SidebarSection>
</div>