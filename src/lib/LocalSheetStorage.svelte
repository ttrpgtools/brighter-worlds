<script lang="ts">
  import StorageMenu from '$lib/StorageMenu.svelte';
  import MenuAction from '$lib/MenuAction.svelte';
  import SaveOnline from '$lib/SaveOnline.svelte';
  import type { SheetCache } from '$lib/data/sheet-manager';
  import { downloadCharacterBundle } from '$lib/data/sheet-backup';
  import DialogBase from '$lib/DialogBase.svelte';
  let { id, cache }: { id: string; cache: SheetCache } = $props();
  let saveDialog: SaveOnline | undefined = $state();
  let notice: DialogBase<undefined> | undefined = $state();
  let error = $state('');
  async function exportFile() {
    try {
      const warnings = await downloadCharacterBundle(id, cache);
      if (warnings.length) {
        error = warnings.join(' ');
        void notice?.open();
      }
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Backup could not be downloaded.';
      void notice?.open();
    }
  }
</script>

<StorageMenu icon="desktop" label="Local sheet" message="Stored in this browser">
  <MenuAction
    icon="cloud"
    label="Save online…"
    action={() => {
      void saveDialog?.open();
    }}
  />
  <MenuAction
    icon="download"
    label="Download backup"
    action={() => {
      void exportFile();
    }}
  />
</StorageMenu>
<SaveOnline bind:this={saveDialog} {id} {cache} hideTrigger />
<DialogBase bind:this={notice} title="Character backup" titleClass="font-title text-3xl"
  ><p class="mt-4" role="alert">{error}</p></DialogBase
>
