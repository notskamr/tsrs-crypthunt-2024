<script lang="ts">
  import { forEach } from "@/utils/funcs";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  export let show = false;

  interface CrypthuntEventListener {
    name: string;
    callback: (event: CustomEvent) => void;
  }

  onMount(() => {
    const crypthuntEventListeners: CrypthuntEventListener[] = [
      {
        name: "correct-answer",
        callback: () => {
          show = true;
          setTimeout(() => {
            show = false;
            window.location.reload();
          }, 3000);
        },
      },
    ];
    forEach(crypthuntEventListeners, (listener: any) => {
      document.addEventListener(
        `crypthunt:${listener.name}`,
        listener.callback
      );
    });
  });
</script>

{#if show}
  <div
    id="screen-overlay"
    class="screen absolute top-0 left-0 backdrop-blur-sm z-50 bg-white/5"
    transition:fly={{ y: 800, duration: 600 }}
  >
    <div class="flex flex-col justify-center items-center h-full w-full">
      <h1
        in:fly={{ y: 50, duration: 400, delay: 500 }}
        class="text-green-500 text-6xl sm:text-8xl px-4 py-2 bg-white rounded-tl-md rounded-br-md"
      >
        CORRECT!
      </h1>
      <button
        title="Continue"
        class="text-6xl mt-4 opacity-80"
        on:click={() => {
          show = false;
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }}
        in:fly={{ y: 50, duration: 400, delay: 550 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
        >
          <g fill="currentColor">
            <path
              d="m12.052 14.829l1.414 1.414L17.71 12l-4.243-4.243l-1.414 1.415L13.88 11H6.343v2h7.537z"
            ></path>
            <path
              fill-rule="evenodd"
              d="M19.778 19.778c4.296-4.296 4.296-11.26 0-15.556c-4.296-4.296-11.26-4.296-15.556 0c-4.296 4.296-4.296 11.26 0 15.556c4.296 4.296 11.26 4.296 15.556 0m-1.414-1.414A9 9 0 1 0 5.636 5.636a9 9 0 0 0 12.728 12.728"
              clip-rule="evenodd"
            ></path>
          </g>
        </svg>
      </button>
    </div>
  </div>
{/if}
