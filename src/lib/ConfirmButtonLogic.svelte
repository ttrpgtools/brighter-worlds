<script lang="ts">
import { createEventDispatcher } from 'svelte';
  import { primaryInput } from './util/detect';
const dispatch = createEventDispatcher();

let confirming = false;
let ready = false;
let mouseouttimer: NodeJS.Timeout | undefined = undefined;
  
function handleClick() {
  if (!confirming) {
    confirming = true;
    setTimeout(() => ready = true, 350);
    if (primaryInput === 'touch') {
      setTimeout(() => {
        ready = false;
        confirming = false;
      }, 4000);
    }
  } else if (ready) {
    confirming = false;
    ready = false;
    dispatch('confirm');
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
<slot {handleClick} {handleIn} {handleOut} {confirming} {ready}></slot>