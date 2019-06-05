import React from 'react';
import { View, Dimensions, ViewPropTypes, FlatList } from 'react-native';
import PropTypes from 'prop-types';

class FlatGrid extends React.Component {
  constructor(props) {
    super(props);

    this.renderRow = this.renderRow.bind(this);
    this.onLayout = this.onLayout.bind(this);

    const { staticDimension, horizontal } = props;

    // Calculate total dimensions and set to state
    let totalDimension = staticDimension;

    if (!staticDimension) {
      const dimension = horizontal ? 'height' : 'width';
      totalDimension = Dimensions.get('window')[dimension];
    }

    this.state = {
      totalDimension
    };
  }

  onLayout(e) {
    const { staticDimension, horizontal, onLayout } = this.props;
    const { totalDimension } = this.state;

    if (!staticDimension) {
      const { width, height } = e.nativeEvent.layout || {};
      const newTotalDimension = horizontal ? height : width;

      if (totalDimension !== newTotalDimension) {
        this.setState({
          totalDimension: newTotalDimension
        });
      }
    }

    // call onLayout prop if passed
    if (onLayout) {
      onLayout(e);
    }
  }

  renderRow({
    rowItems,
    rowIndex,
    separators,
    isLastRow,
    itemsPerRow,
    rowStyle,
    containerStyle
  }) {
    const { spacing, horizontal, itemContainerStyle, renderItem } = this.props;

    // To make up for the top padding
    let additionalRowStyle = {};
    if (isLastRow) {
      additionalRowStyle = {
        ...(!horizontal ? { marginBottom: spacing } : {}),
        ...(horizontal ? { marginRight: spacing } : {})
      };
    }

    return (
      <View style={[rowStyle, additionalRowStyle]}>
        {rowItems.map((item, i) => (
          <View
            key={`item_${rowIndex * itemsPerRow + i}`}
            style={[containerStyle, itemContainerStyle]}
          >
            {renderItem({
              item,
              index: rowIndex * itemsPerRow + i,
              separators,
              rowIndex
            })}
          </View>
        ))}
      </View>
    );
  }

  render() {
    const {
      items,
      style,
      spacing,
      fixed,
      itemDimension,
      renderItem,
      horizontal,
      onLayout,
      staticDimension,
      itemContainerStyle,
      ...restProps
    } = this.props;

    const { totalDimension } = this.state;

    const {
      containerDimension,
      itemsPerRow,
      fixedSpacing
    } = this.calculateDimensions({
      itemDimension,
      staticDimension,
      totalDimension,
      spacing,
      fixed
    });

    const { containerStyle, rowStyle } = this.generateStyles({
      horizontal,
      itemDimension,
      containerDimension,
      spacing,
      fixedSpacing,
      fixed
    });

    const rows = this.chunkArray(items, itemsPerRow); // Splitting the data into rows

    return (
      <FlatList
        data={rows}
        renderItem={({ item, index }) =>
          this.renderRow({
            rowItems: item,
            rowIndex: index,
            isLastRow: index === rows.length - 1,
            itemsPerRow,
            rowStyle,
            containerStyle
          })
        }
        style={[
          {
            ...(horizontal ? { paddingLeft: spacing } : { paddingTop: spacing })
          },
          style
        ]}
        onLayout={this.onLayout}
        keyExtractor={(_, index) => `row_${index}`}
        {...restProps}
        horizontal={horizontal}
        ref={flatList => {
          this.flatList = flatList;
        }}
      />
    );
  }

  chunkArray(array = [], size) {
    if (array === []) return [];
    return array.reduce((acc, val) => {
      if (acc.length === 0) acc.push([]);
      const last = acc[acc.length - 1];
      if (last.length < size) {
        last.push(val);
      } else {
        acc.push([val]);
      }
      return acc;
    }, []);
  }

  calculateDimensions({
    itemDimension,
    staticDimension,
    totalDimension,
    fixed,
    spacing
  }) {
    const usableTotalDimension = staticDimension || totalDimension;
    const availableDimension = usableTotalDimension - spacing; // One spacing extra
    const itemTotalDimension = Math.min(
      itemDimension + spacing,
      availableDimension
    ); // itemTotalDimension should not exceed availableDimension
    const itemsPerRow = Math.floor(availableDimension / itemTotalDimension);
    const containerDimension = availableDimension / itemsPerRow;

    let fixedSpacing;
    if (fixed) {
      fixedSpacing =
        (totalDimension - itemDimension * itemsPerRow) / (itemsPerRow + 1);
    }

    return {
      itemTotalDimension,
      availableDimension,
      itemsPerRow,
      containerDimension,
      fixedSpacing
    };
  }

  generateStyles({
    itemDimension,
    containerDimension,
    spacing,
    fixed,
    horizontal,
    fixedSpacing
  }) {
    let rowStyle = {
      flexDirection: 'row',
      paddingLeft: fixed ? fixedSpacing : spacing,
      paddingBottom: spacing
    };

    let containerStyle = {
      flexDirection: 'column',
      justifyContent: 'center',
      width: fixed ? itemDimension : containerDimension - spacing,
      marginRight: fixed ? fixedSpacing : spacing
    };

    if (horizontal) {
      rowStyle = {
        flexDirection: 'column',
        paddingTop: fixed ? fixedSpacing : spacing,
        paddingRight: spacing
      };

      containerStyle = {
        flexDirection: 'row',
        justifyContent: 'center',
        height: fixed ? itemDimension : containerDimension - spacing,
        marginBottom: fixed ? fixedSpacing : spacing
      };
    }

    return {
      containerStyle,
      rowStyle
    };
  }
}

FlatGrid.propTypes = {
  renderItem: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  itemDimension: PropTypes.number,
  fixed: PropTypes.bool,
  spacing: PropTypes.number,
  style: ViewPropTypes.style,
  itemContainerStyle: ViewPropTypes.style,
  staticDimension: PropTypes.number,
  horizontal: PropTypes.bool,
  onLayout: PropTypes.func
};

FlatGrid.defaultProps = {
  fixed: false,
  itemDimension: 120,
  spacing: 10,
  style: {},
  itemContainerStyle: undefined,
  staticDimension: undefined,
  horizontal: false,
  onLayout: null
};

export default FlatGrid;
