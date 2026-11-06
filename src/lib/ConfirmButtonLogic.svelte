<script lang="ts">
  import { primaryInput } from './util/detect';
  import { onDestroy } from 'svelte';
  interface Props {
    onconfirm: () => void;
    children: import('svelte').Snippet<
      [
        {
          handleClick: () => void;
          handleIn: () => void;
          handleOut: () => void;
          confirming: boolean;
          ready: boolean;
          cancel: () => void;
        },
      ]
    >;
  }

  let { children, onconfirm }: Props = $props();

  let confirming = $state(false);
  let ready = $state(false);
  let mouseouttimer: ReturnType<typeof setTimeout> | undefined;
  let readyTimer: ReturnType<typeof setTimeout> | undefined;
  let touchTimer: ReturnType<typeof setTimeout> | undefined;

  function cancel() {
    clearTimeout(mouseouttimer);
    clearTimeout(readyTimer);
    clearTimeout(touchTimer);
    confirming = false;
    ready = false;
  }

  function handleClick() {
    if (!confirming) {
      confirming = true;
      readyTimer = setTimeout(() => (ready = true), 350);
      if (primaryInput === 'touch') {
        touchTimer = setTimeout(cancel, 4000);
      }
    } else if (ready) {
      cancel();
      onconfirm();
    }
  }
  function handleOut() {
    if (mouseouttimer) {
      clearTimeout(mouseouttimer);
    }
    mouseouttimer = setTimeout(cancel, 1500);
  }

  function handleIn() {
    if (mouseouttimer) {
      clearTimeout(mouseouttimer);
    }
  }

  onDestroy(cancel);
</script>

{@render children({ handleClick, handleIn, handleOut, confirming, ready, cancel })}
