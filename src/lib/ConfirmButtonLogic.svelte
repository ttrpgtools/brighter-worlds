<script lang="ts">
  import { primaryInput } from './util/detect';
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
        }
      ]
    >;
  }

  let { children, onconfirm }: Props = $props();

  let confirming = $state(false);
  let ready = $state(false);
  let mouseouttimer: ReturnType<typeof setTimeout> | undefined = undefined;

  function handleClick() {
    if (!confirming) {
      confirming = true;
      setTimeout(() => (ready = true), 350);
      if (primaryInput === 'touch') {
        setTimeout(() => {
          ready = false;
          confirming = false;
        }, 4000);
      }
    } else if (ready) {
      confirming = false;
      ready = false;
      onconfirm();
    }
  }
  function handleOut() {
    if (mouseouttimer) {
      clearTimeout(mouseouttimer);
    }
    mouseouttimer = setTimeout(() => {
      confirming = false;
      ready = false;
    }, 1500);
  }

  function handleIn() {
    if (mouseouttimer) {
      clearTimeout(mouseouttimer);
    }
  }
</script>

{@render children({ handleClick, handleIn, handleOut, confirming, ready })}
