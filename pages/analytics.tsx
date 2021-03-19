import {useEffect, useState} from "react";
import ArDB from 'ardb';
import Arweave from 'arweave'
import {GQLEdgeTransactionInterface, GQLTransactionInterface} from "ardb/lib/faces/gql";
import {Card, Grid, Table} from "@geist-ui/react";

const config = {
  host: 'arweave.net',// Hostname or IP address for a Arweave host
  port: 443,          // Port
  protocol: 'https',  // Network protocol http or https
  timeout: 20000,     // Network request timeouts in milliseconds
  logging: false,     // Enable network request logging
}

const ardb = new ArDB(new Arweave(config));

const getUniqueUsers = async (): Promise<number> => {

  const transactions: any = await ardb.search('transactions').tag('Exchange', 'Verto').tag('Type', ['Buy', 'Sell', 'Swap']).findAll();

  const users = new Set()
  transactions.map((transaction: GQLTransactionInterface) => {
    users.add(transaction.owner) // todo add address
  })

  return users.size
}

const getTradeCount = async (): Promise<number> => {

  const transactions: any = await ardb.search('transactions').tag('Exchange', 'Verto').tag('Type', ['Buy', 'Sell', 'Swap']).findAll();

  return transactions.length
}

const getTokenholderTips = async (): Promise<{ ticker: string, amount: number }[]> => {

  const transactions: any = await ardb.search('transactions').tag('Exchange', 'Verto').tag('Type', 'Fee-VRT-Holder').findAll();
  const tips = {}

  transactions.map((transaction: GQLEdgeTransactionInterface) => {
    let amount, contract;

    for (const tag of transaction.node.tags) {

      if (tag.name == "Input") {
        const data = JSON.parse(tag.value)
        amount = parseInt(data.qty)
      }
      if (tag.name == "Contract") {
        contract = tag.value
      }
    }

    if (contract in tips) {
      tips[contract] += amount
    } else {
      tips[contract] = amount
    }
  })


  let result = []
  for (const contract in tips) {
    result.push({ticker: contract, amount: tips[contract]})
  }

  result = result.sort((a, b) => b.amount - a.amount)

  return result
}

const getVolume = async (): Promise<number> => {

  const transactions: any = await ardb.search('transactions').tag('Exchange', 'Verto').tag('Type', 'Buy').findAll();
  let volume = 0

  transactions.map((transaction: GQLEdgeTransactionInterface) => {
    volume += parseFloat(transaction.node.quantity.ar)
  })

  return volume
}

const getRetention = async (): Promise<number> => {

  const transactions: any = await ardb.search('transactions').tag('Exchange', 'Verto').tag('Type', 'Buy').findAll();
  let volume = 0

  transactions.map((transaction: GQLEdgeTransactionInterface) => {
    volume += parseFloat(transaction.node.quantity.ar)
  })

  return volume
}

const Analytics = () => {

  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [volume, setVolume] = useState(0);
  const [tips, setTips] = useState([]);

  // unique user count
  useEffect(() => {
    getUniqueUsers().then((count) => {
      setUniqueUsers(count);
    })
    getTradeCount().then((count) => {
      setTotalTrades(count)
    })
    getTokenholderTips().then((tips) => {
      console.log("VRT holder tips", tips)
      setTips(tips)
    })
    getVolume().then((volume) => {
      setVolume(parseFloat(volume.toFixed(4)))
    })
  }, [])

  return (
    <>
      Hello World!
      <Grid.Container>
        <Grid>
          <Card>
            <h4>Unique Users</h4>
            <Card.Content>
              <h3>{uniqueUsers}</h3>
            </Card.Content>
          </Card>
        </Grid>
        <Grid>
          <Card>
            <h4>Trades</h4>
            <Card.Content>
              <h3>{totalTrades}</h3>
            </Card.Content>
          </Card>
        </Grid>
        <Grid>
          <Card>
            <h4>Volume</h4>
            <Card.Content>
              <h3>{volume} AR</h3>
            </Card.Content>
          </Card>
        </Grid>

        <Grid>
          <Card>
            <h4>VRT holder received:</h4>
            <Card.Content>
              <Table data={tips}>
                <Table.Column prop="ticker" label="Ticker"/>
                <Table.Column prop="amount" label="Amount"/>
              </Table>
            </Card.Content>
          </Card>
        </Grid>
      </Grid.Container>
    </>
  )
}

export default Analytics;