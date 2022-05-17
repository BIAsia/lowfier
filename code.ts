// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

const fillPaint:Paint = {
  type: 'SOLID',
  color: hexToRgb('#222222')
}
const strokeGroupPaint:Paint = {
  type: 'SOLID',
  color: hexToRgb('#bcbcbc')
}
let selection: SceneNode[] = [];

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-lowfi') {
    const nodes: SceneNode[] = [];
    selection = figma.currentPage.selection.concat();
    
    
    selection.forEach((node)=>{
      traverseAllNodes(node);
    })

    
    figma.currentPage.selection = selection;
    figma.viewport.scrollAndZoomIntoView(selection);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  // figma.closePlugin();
};

function traverseAllNodes(node:SceneNode){
  if (node.type === 'FRAME'
    ||node.type === 'GROUP'
  ) {
    outlineGroup(node);
    node.children.forEach((c)=>traverseAllNodes(c))
  }
  else if (
    node.type === 'ELLIPSE'   ||
    node.type === 'POLYGON'   ||
    node.type === 'RECTANGLE' ||
    node.type === 'STAR'      
    // node.type === 'VECTOR'
  ) fillShape(node);
  else if (node.type === 'INSTANCE'){
    selection = selection.filter((n) => n.id !== node.id );
    console.log(selection)
    const newFrame = node.detachInstance();
    selection.push(newFrame);
    traverseAllNodes(newFrame);
  }
}

function outlineGroup(node){

  const hasFill = node.fills?node.fills.length && node.fills[0].visible:false;
  const hasStroke = node.strokes?node.strokes.length && node.strokes[0].visible:false;

  console.log(hasFill + " " + hasStroke);
  if (!(hasFill || hasStroke)) return;
  let fills = clone(node.fills);
  fills.forEach((e)=>{
    if (e.opacity == 0 || e.visible == false) return;
  })
  let strokes = clone(node.strokes);
  strokes.forEach((e)=>{
    if (e.opacity == 0 || e.visible == false) return;
  })
  strokes = [strokeGroupPaint];
  node.strokes = strokes;
  node.fills = [];
  node.effects = [];
}

function fillShape(node:EllipseNode|PolygonNode|RectangleNode|StarNode|VectorNode){
  if (node.opacity == 0 || node.visible == false) return;
  node.opacity = 1;
  node.blendMode = 'PASS_THROUGH';
  node.effects = [];
  let newFills:Paint[] = clone(node.fills);
  newFills.forEach((e)=>{
    if (e.opacity == 0 || e.visible == false) return;
  })
  newFills = [fillPaint];
  node.fills = newFills;
}

function clone(val) {
  return JSON.parse(JSON.stringify(val))
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16)/255,
    g: parseInt(result[2], 16)/255,
    b: parseInt(result[3], 16)/255
  } : null;
}