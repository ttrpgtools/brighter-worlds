<script lang="ts">
  export let name: string;
  export let pronouns: string;
</script>
<div class="relative md:col-span-2 flex-1 bg-white dark:bg-gray-900 p-0 shadow-xl dark:shadow-purple-400/20 ring-1 ring-gray-900/5 rounded-lg flex flex-row gap-4 items-end">
  <div class="flex-1 flex-grow h-full w-3/4">
    <input type="text" class="w-full border-0 dark:bg-gray-900 placeholder-shown:bg-gray-100 dark:placeholder-shown:bg-black focus:border-purple-600 focus:ring-0 font-title text-3xl p-4 rounded-l-lg h-full" placeholder="Name" bind:value={name}>
  </div>
  <div class="h-full w-1/4 min-w-[8.125rem]">
    <input type="text" class="border-0 w-full  dark:bg-gray-900 placeholder-shown:bg-gray-100 dark:placeholder-shown:bg-black focus:border-purple-600 focus:ring-0 font-title text-2xl p-4 rounded-r-lg h-full" placeholder="Pronouns" bind:value={pronouns}>
  </div>
</div>