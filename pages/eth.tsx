import Arweave from "arweave";
import Verto from "@verto/lib";
import { getContract } from "cacheweave";
import { useState, useEffect } from "react";
import { all } from "ar-gql";
import Head from "next/head";
import { Page } from "@geist-ui/react";
import { Pie } from "react-chartjs-2";

const contract = "usjm4PCxUd5mtaon7zc97-dt-3qf67yPyqgzLnLqk5A";

const client = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

const verto = new Verto(null, client);

const Eth = () => {
  const [data, setData] = useState([]);

  const graphOptions = {
    legend: {
      display: false,
    },
  };
  const emptyGraphData = {
    labels: [],
    datasets: [
      {
        label: "Address Weights",
        data: [],
      },
    ],
  };
  const [graphData, setGraphData] = useState(emptyGraphData);

  const getLinkedAddresses = async (): Promise<
    {
      arWallet: string;
      ethWallet: string;
    }[]
  > => {
    const linkedAddresses: {
      arWallet: string;
      ethWallet: string;
    }[] = [];
    const res = await all(`
      query($cursor: String) {
        transactions(
          tags: [
            { name: "Application", values: "ArLink" }
            { name: "Chain", values: "ETH" }
          ]
          after: $cursor
        ) {
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              owner {
                address
              }
              tags {
                name
                value
              }
            }
          }
        }
      }
    `);

    for (const tx of res) {
      const index = linkedAddresses.findIndex(
        (element) => element.arWallet === tx.node.owner.address
      );
      if (index === -1) {
        // Address was not found
        linkedAddresses.push({
          arWallet: tx.node.owner.address,
          ethWallet: tx.node.tags.find((tag) => tag.name === "Wallet").value,
        });
      }
    }

    return linkedAddresses;
  };

  const getWeights = async () => {
    setGraphData(emptyGraphData);

    const contractState = await getContract(client, contract);

    for (const user of data) {
      let amountOfVRT = 0;

      const stake = await verto.getPostStake(user.arWallet);
      amountOfVRT += stake;

      // @ts-expect-error
      const unlockedBalance = contractState.balances[user.arWallet];
      amountOfVRT += unlockedBalance;

      if (amountOfVRT > 0) {
        setGraphData((state) => {
          return {
            ...state,
            labels: [...state.labels, user.arWallet],
            datasets: [
              {
                ...state.datasets[0],
                data: [...state.datasets[0].data, amountOfVRT],
              },
            ],
          };
        });
      }
    }
  };

  useEffect(() => {
    getLinkedAddresses().then((res) => setData(res));
    setInterval(async () => {
      setData(await getLinkedAddresses());
    }, 360000);
  }, []);

  useEffect(() => {
    getWeights();
  }, [data]);

  return (
    <>
      <Head>
        <title>Orbit / ETH</title>
      </Head>
      <Page>
        <Pie data={graphData} options={graphOptions} />
      </Page>
    </>
  );
};

export default Eth;
