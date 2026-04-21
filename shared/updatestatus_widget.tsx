import React, { useState, useEffect } from 'react';
import { appActions } from 'jimu-core';
import { Button } from 'jimu-ui';

import {
  buttonStyle,
  popupContainer,
  popupTitleBar,
  popupMessage,
  popupButtonArea,
  popupButton
} from '../style';

export default function Widget(props: any) {
  const [recvText, setRecvText] = useState("Empty");
  const [popupMsg, setPopupMsg] = useState("");
  const [popupColor, setPopupColor] = useState(""); // "green" = success

  // NEW CHANGE: track the row count received from GridDataLoaded — Request 2.
  // Initialised to -1 so the button is visible by default until the first
  // GridDataLoaded notification arrives. Once a notification is received,
  // the button is shown only when count >= 1.
  const [rowCount, setRowCount] = useState<number>(-1);

  // Existing TextContent listener (unchanged)
  useEffect(() => {
    if (props.stateProps?.TextContent) {
      if (recvText === "Empty" || recvText !== props.stateProps.TextContent) {
        setRecvText(props.stateProps.TextContent);
      }
    }
  }, [props.stateProps?.TextContent]);

  // NEW CHANGE: GridDataLoaded listener — Request 2.
  // Watches the channel name configured in settings (gridDataListenChannel).
  // When a notification arrives, reads payload.count and updates rowCount.
  // The main button is then shown or hidden based on whether count >= 1.
  const listenChannel = props.config.gridDataListenChannel || 'GridDataLoaded';
  useEffect(() => {
    const payload = props.stateProps?.[listenChannel];
    if (!payload) return;

    const count = typeof payload.count === 'number' ? payload.count : parseInt(payload.count, 10);

    if (!isNaN(count)) {
      setRowCount(count);
    }
  }, [props.stateProps?.[listenChannel]]);

  // Show popup (unchanged)
  const showPopup = (message: string, color: string) => {
    setPopupMsg(message);
    setPopupColor(color);
  };

  // Close popup → navigate only if success (unchanged)
  const closePopup = () => {
    const wasSuccess = popupColor === "green";

    if (wasSuccess && props.config.useNavigation) {
      navigateToView();
    }
    setPopupMsg("");
    setPopupColor("");
  };

  useEffect(() => {
    if (popupColor === "green") {
      const t = setTimeout(() => {
        closePopup();
      }, 2000);

      return () => clearTimeout(t);
    }
  }, [popupColor]);

  // Replace parameter placeholders (unchanged)
  const getButtonParamExpression = () => {
    let exp = props.config.button_action_params;
    const regex = /{(.*?)}/g;

    let params = getAllUrlParams(window.location.href);
    const textValue = recvText !== "Empty" ? recvText : params["crn"];

    let matches = [...exp.matchAll(regex)];

    matches.forEach(match => {
      const key = match[1];
      exp = exp.replace(match[0], params[key]);
    });

    return exp;
  };

  // Query string parser (unchanged)
  const getAllUrlParams = (url: string) => {
    let params: any = {};
    let query = url.split("?")[1] || "";
    query = query.split("#")[0];

    let pairs = query.split("&");
    for (let p of pairs) {
      if (!p) continue;
      let [key, val] = p.split("=");
      params[key?.toLowerCase()] = val;
    }

    return params;
  };

  // API PUT call with success/failure popup (unchanged)
  const makePutAPICall = async (url: string) => {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });

      let payload: any = {};
      try {
        payload = await response.json();
      } catch {}

      const httpSuccess = response.ok;
      const payloadSuccess = payload && httpSuccess;

      if (payloadSuccess) {
        const msg =
          props.config.api_success_message ||
          "Action completed successfully.";

        showPopup(msg, "green");
        dispatchItems();
      } else {
        const msg =
          props.config.api_failure_message ||
          "API request failed.";

        showPopup(msg, "red");
      }
    } catch (err) {
      const msg =
        props.config.api_failure_message ||
        "API request failed.";

      showPopup(msg, "red");
    }
  };

  // Update other widgets via ESRI dispatch (unchanged)
  const dispatchItems = () => {
    const ids = props.config.targetWidgetIds || [];
    ids.forEach((widgetId: string) => {
      props.dispatch(
        appActions.widgetStatePropChange(
          widgetId,
          "TextContent",
          props.stateProps?.TextContent
        )
      );
    });
  };

  // Navigate to view (unchanged)
  const navigateToView = () => {
    if (!props.config.useNavigation) return;

    let url = window.location.href;
    let params: any = getAllUrlParams(url);

    if (params["crn"]) delete params["crn"];
    if (params["views"]) params["views"] = props.config.view_name;

    let qs = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");

    let base = url.includes("?") ? url.split("?")[0] : url;

    window.open(base + "?" + qs, "_self");
  };

  // Main button click (unchanged)
  const onButtonClick = () => {
    if (props.config.button_action_url) {
      let url =
        props.config.button_action_url +
        "?" +
        getButtonParamExpression();

      makePutAPICall(url);
    }
  };

  // NEW CHANGE: derive button visibility — Request 2.
  // rowCount === -1 means no GridDataLoaded notification has arrived yet
  // (widget has just mounted). In that case we show the button by default
  // so it is visible before the grid has finished loading for the first time.
  // Once at least one notification has been received, show only when count >= 1.
  const showMainButton = rowCount === -1 || rowCount >= 1;

  return (
    <div>
      {/* Popup (unchanged) */}
      {popupMsg && (
        <div style={popupContainer}>
          <div style={popupTitleBar}>ETS Review</div>
          <div style={popupMessage}>{popupMsg}</div>
          <div style={popupButtonArea}>
            {popupColor !== "green" && (
              <button
                onClick={closePopup}
                style={popupButton}>
                OK
              </button>
            )}
          </div>
        </div>
      )}

      {/* NEW CHANGE: Main Button — Request 2.
          Conditionally rendered based on rowCount received from GridDataLoaded.
          Hidden when the grid reports 0 rows, visible when >= 1 row is present. */}
      {showMainButton && (
        <Button
          style={buttonStyle}
          onClick={onButtonClick}>
          {props.config.buttonCaption}
        </Button>
      )}
    </div>
  );
}
