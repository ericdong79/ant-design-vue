import { defineComponent, ref } from 'vue';
import generatePicker, {
  PickerTimeProps,
  RangePickerTimeProps,
} from '../date-picker/generatePicker';
import {
  commonProps,
  datePickerProps,
  rangePickerProps,
} from '../date-picker/generatePicker/props';
import { GenerateConfig } from '../vc-picker/generate';
import { PanelMode, RangeValue } from '../vc-picker/interface';
import { RangePickerSharedProps } from '../vc-picker/RangePicker';
import devWarning from '../vc-util/devWarning';

export interface TimePickerLocale {
  placeholder?: string;
  rangePlaceholder?: [string, string];
}

const timpePickerProps = {
  format: String,
  showNow: Boolean,
  showHour: Boolean,
  showMinute: Boolean,
  showSecond: Boolean,
  use12Hours: Boolean,
  hourStep: Number,
  minuteStep: Number,
  secondStep: Number,
  hideDisabledOptions: Boolean,
  popupClassName: String,
};

function createTimePicker<DateType>(generateConfig: GenerateConfig<DateType>) {
  const DatePicker = generatePicker<DateType>(generateConfig);
  const { TimePicker: InternalTimePicker, RangePicker: InternalRangePicker } = DatePicker as any;
  interface TimeRangePickerProps extends Omit<RangePickerTimeProps<DateType>, 'picker'> {
    popupClassName?: string;
    valueFormat?: string;
  }
  interface TimePickerProps extends Omit<PickerTimeProps<DateType>, 'picker'> {
    popupClassName?: string;
    valueFormat?: string;
  }
  const TimePicker = defineComponent<TimePickerProps>({
    name: 'ATimePicker',
    inheritAttrs: false,
    props: {
      ...commonProps<DateType>(),
      ...datePickerProps<DateType>(),
      ...timpePickerProps,
    } as any,
    slot: ['addon', 'renderExtraFooter', 'suffixIcon', 'clearIcon'],
    emits: ['change', 'openChange', 'focus', 'blur', 'ok', 'update:value'],
    setup(props, { slots, expose, emit, attrs }) {
      devWarning(
        !slots.addon,
        'TimePicker',
        '`addon` is deprecated. Please use `renderExtraFooter` instead.',
      );
      const pickerRef = ref();
      expose({
        focus: () => {
          pickerRef.value?.focus();
        },
        blur: () => {
          pickerRef.value?.blur();
        },
      });
      const onChange = (value: DateType | string, dateString: string) => {
        emit('update:value', value);
        emit('change', value, dateString);
      };
      const onOpenChange = (open: boolean) => {
        emit('openChange', open);
      };
      const onFoucs = () => {
        emit('focus');
      };
      const onBlur = () => {
        emit('blur');
      };
      const onOk = (value: DateType) => {
        emit('ok', value);
      };
      return () => {
        return (
          <InternalTimePicker
            {...attrs}
            {...slots}
            {...props}
            dropdownClassName={props.popupClassName}
            mode={undefined}
            ref={pickerRef}
            renderExtraFooter={slots.addon ?? props.renderExtraFooter ?? slots.renderExtraFooter}
            onChange={onChange}
            onOpenChange={onOpenChange}
            onFocus={onFoucs}
            onBlur={onBlur}
            onOk={onOk}
          />
        );
      };
    },
  });

  const TimeRangePicker = defineComponent<TimeRangePickerProps>({
    name: 'ATimeRangePicker',
    inheritAttrs: false,
    props: {
      ...commonProps<DateType>(),
      ...rangePickerProps<DateType>(),
      ...timpePickerProps,
      order: { type: Boolean, default: true },
    } as any,
    slot: ['renderExtraFooter', 'suffixIcon', 'clearIcon'],
    emits: [
      'change',
      'panelChange',
      'ok',
      'openChange',
      'update:value',
      'calendarChange',
      'focus',
      'blur',
    ],
    setup(props, { slots, expose, emit, attrs }) {
      const pickerRef = ref();
      expose({
        focus: () => {
          pickerRef.value?.focus();
        },
        blur: () => {
          pickerRef.value?.blur();
        },
      });
      const onChange = (
        values: [DateType, DateType] | [string, string],
        dateStrings: [string, string],
      ) => {
        emit('update:value', values);
        emit('change', values, dateStrings);
      };
      const onOpenChange = (open: boolean) => {
        emit('openChange', open);
      };
      const onFoucs = () => {
        emit('focus');
      };
      const onBlur = () => {
        emit('blur');
      };
      const onPanelChange = (
        values: string | RangeValue<DateType>,
        modes: [PanelMode, PanelMode],
      ) => {
        emit('panelChange', values, modes);
      };
      const onOk = (value: DateType) => {
        emit('ok', value);
      };
      const onCalendarChange: RangePickerSharedProps<DateType>['onCalendarChange'] = (
        values: [DateType, DateType] | [string, string],
        dateStrings: [string, string],
        info,
      ) => {
        emit('calendarChange', values, dateStrings, info);
      };
      return () => {
        return (
          <InternalRangePicker
            {...attrs}
            {...slots}
            {...props}
            dropdownClassName={props.popupClassName}
            picker="time"
            mode={undefined}
            ref={pickerRef}
            onChange={onChange}
            onOpenChange={onOpenChange}
            onFocus={onFoucs}
            onBlur={onBlur}
            onPanelChange={onPanelChange}
            onOk={onOk}
            onCalendarChange={onCalendarChange}
          />
        );
      };
    },
  });

  return {
    TimePicker,
    TimeRangePicker,
  };
}

export default createTimePicker;
