import React, { Component } from "react";
import styled from "styled-components";
import update from "immutability-helper";

import Graph from "./Graph";
import logo from "./media/robot-240w.png";

const AppBox = styled.div`
  display: flex;
  flex-direction: column;
  margin: 20px 40px;
`;
const Header = styled.header`
  align-items: center;
  display: flex;
  justify-content: center;
`;
const TitleBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Title = styled.h1`
  margin: 0 40px 0 0;
  font-family: Impact;
  font-size: 124px;
`;
const SubTitle = styled.h2`
  margin: 0;
  font-family: Courier;
  font-size: 62px;
`;

function fetchRange(
  URL,
  query,
  target,
  duration = 60 * 60 * 3 * 1000,
  step = 10
) {
  const now = new Date().toISOString();
  const then = new Date(Date.now() - duration).toISOString();
  const e = encodeURIComponent;
  const req = new Request(
    `${URL}/api/v1/query_range?query=${e(query)}&start=${e(then)}&end=${e(now)}&step=${e(step)}`
  );
  return fetch(req, {
    method: "GET",
    mode: "cors",
    cache: "no-cache"
  })
    .then(resp => resp.json())
    .then(content => {
      content.target = target;
      return content;
    });
}

function groupDatapoints(queries) {
  return queries.reduce((acc, query) => {
    if (query.status === "success") {
      const result = query.data.result;
      if (result.length !== 1) {
        throw new Error(`unexpected series count: ${result.length}`);
      }
      acc[query.target] = result[0];
    }

    return acc;
  }, {});
}

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      graphs: [{}]
    };
  }

  render() {
    const graphs = this.state.graphs.map((graphData, idx) => {
      return (
        <Graph
          key={idx}
          graphData={graphData}
          onExecute={formData => this.onExecute(formData, idx)}
        />
      );
    });

    return (
      <AppBox>
        <Header>
          <TitleBox>
            <Title>predicatron</Title>
            <SubTitle>3000</SubTitle>
          </TitleBox>
          <img src={logo} alt="logo" />
        </Header>
        {graphs}
      </AppBox>
    );
  }

  onExecute(formData, graphIdx) {
    this.setState(
      update(this.state, {
        graphs: { [graphIdx]: { datapoints: { $set: false } } }
      })
    );

    const { promURL, predictMetric } = formData;
    fetchRange(promURL, predictMetric, "metric").then(content => {
      const datapoints = groupDatapoints([content]);
      this.setState(
        update(this.state, {
          graphs: { [graphIdx]: { datapoints: { $set: datapoints } } }
        })
      );
    });

    // const query = `${formData.predictMethod}:${formData.predictMetric}`;
  }
}