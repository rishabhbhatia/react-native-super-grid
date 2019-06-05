import React, { Component } from 'react';
import { View, Dimensions, ViewPropTypes, SectionList } from 'react-native';
import PropTypes from 'prop-types';

class SectionGrid extends Component {
  constructor(props) {
    super(props);
    this.onLayout = this.onLayout.bind(this);
    this.renderRow = this.renderRow.bind(this);

    const { staticDimension } = props;

    // Calculate total dimensions and set to state
    let totalDimension = staticDimension;
    if (!staticDimension) {
      totalDimension = Dimensions.get('window').width;
    }

    this.state = {
      totalDimension
    };
  }

  onLayout(e) {
    const { staticDimension, onLayout } = this.props;
    const { totalDimension } = this.state;

    if (!staticDimension) {
      const { width: newTotalDimension } = e.nativeEvent.layout || {};

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
    section,
    itemsPerRow,
    rowStyle,
    separators,
    isFirstRow,
    containerStyle
  }) {
    const { spacing, itemContainerStyle, renderItem } = this.props;

    // Add spacing below section header
    let additionalRowStyle = {};
    if (isFirstRow) {
      additionalRowStyle = {
        marginTop: spacing
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
              section,
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
      sections,
      style,
      spacing,
      fixed,
      itemDimension,
      staticDimension,
      renderItem,
      onLayout,
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
      itemDimension,
      containerDimension,
      spacing,
      fixedSpacing,
      fixed
    });

    const groupedSections = sections.map(section => {
      const chunkedData = this.chunkArray(section.data, itemsPerRow);

      return {
        ...section,
        data: chunkedData,
        originalData: section.data
      };
    });

    return (
      <SectionList
        sections={groupedSections}
        renderItem={({ item, index, section }) =>
          this.renderRow({
            rowItems: item,
            rowIndex: index,
            section,
            isFirstRow: index === 0,
            itemsPerRow,
            rowStyle,
            containerStyle
          })
        }
        keyExtractor={(_, index) => `row_${index}`}
        style={style}
        onLayout={this.onLayout}
        ref={sectionList => {
          this.sectionList = sectionList;
        }}
        {...restProps}
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

SectionGrid.propTypes = {
  renderItem: PropTypes.func.isRequired,
  sections: PropTypes.arrayOf(PropTypes.any).isRequired,
  itemDimension: PropTypes.number,
  fixed: PropTypes.bool,
  spacing: PropTypes.number,
  style: ViewPropTypes.style,
  itemContainerStyle: ViewPropTypes.style,
  staticDimension: PropTypes.number,
  onLayout: PropTypes.func
};

SectionGrid.defaultProps = {
  fixed: false,
  itemDimension: 120,
  spacing: 10,
  style: {},
  itemContainerStyle: undefined,
  staticDimension: undefined,
  onLayout: null
};

export default SectionGrid;
