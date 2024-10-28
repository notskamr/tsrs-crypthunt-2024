<script lang="ts">
  import { DataHandler, Datatable, Th, ThFilter } from "@vincjo/datatables";
  export let data: any[] = [];

  let tableElement: HTMLElement | undefined;

  const handler = new DataHandler(data, { rowsPerPage: 25 });
  const rows = handler.getRows();

  handler.applySort({
    orderBy: "createdAt",
    direction: "desc",
  });

  // console.log(data[0]);
  $: data, update();

  const update = () => {
    if (tableElement) {
      const scrollTop = (tableElement.parentNode as HTMLElement).scrollTop;
      handler.setRows(data);
      setTimeout(() => {
        (tableElement!.parentNode as HTMLElement).scrollTop = scrollTop;
      }, 2);
    }
  };
</script>

<Datatable {handler}>
  <table class="w-full" bind:this={tableElement}>
    <thead>
      <tr>
        <Th {handler} align="center" orderBy={(row) => Number(row.id)}>Id</Th>
        <Th {handler} align="center" orderBy={(row) => row?.user?.username}
          >User</Th
        >
        <Th {handler} align="center" orderBy={(row) => row.team.name}>Team</Th>
        <Th {handler} align="center" orderBy={(row) => Number(row.questionId)}
          >Question ID</Th
        >
        <Th {handler} align="center" orderBy="response">Response</Th>
        <Th {handler} align="center" orderBy={(row) => Number(row.isCorrect)}
          >Correct</Th
        >
        <Th {handler} align="center" orderBy={(row) => row.createdAt}>Time</Th>
      </tr>
      <tr>
        <ThFilter align="center" {handler} filterBy="id" />
        <ThFilter align="center" {handler} filterBy="user" />
        <ThFilter align="center" {handler} filterBy="team" />
        <ThFilter
          align="center"
          {handler}
          filterBy={(row) => Number(row.questionId)}
        />
        <ThFilter align="center" {handler} filterBy="response" />
        <ThFilter
          align="center"
          {handler}
          filterBy={(row) => (row.isCorrect ? "Yes" : "No")}
        />
        <ThFilter align="center" {handler} filterBy={(row) => row.createdAt} />
      </tr>
    </thead>
    <tbody>
      {#each $rows as row}
        <tr
          id={row.id}
          class="cursor-pointer"
          on:click={() => {
            window.location.href = `/admin/responses/${row.id}`;
          }}
        >
          <td class="w-8" id="id">{row.id}</td>
          <td id="username" data-username={row?.user?.username || "null"}
            >{row?.user?.username || "null"}</td
          >
          <td id="team">{row.team.name}</td>
          <td id="qid">{row.questionId}</td>
          <td id="response">{row.response}</td>
          <td id="correct">{row.isCorrect ? "Yes" : "No"}</td>
          <td id="time">{row.createdAt}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</Datatable>

<style>
  /* thead {
    background: #fff;
  } */

  tbody tr {
    transition: all, 0.2s;
  }
  tbody tr:hover {
    background: #f0f0f0;
  }
  @media (prefers-color-scheme: dark) {
    tbody tr:hover {
      background: #333;
    }
  }

  td {
    padding: 0.5rem;
    text-align: center;
  }

  #team {
    text-transform: capitalize;
  }

  #username[data-username="null"]:before {
    content: "null";
    color: #656565;
    font-style: italic;
  }

  #username[data-username="null"] {
    color: #0000;
    user-select: none;
  }
</style>
