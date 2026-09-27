<template>
  <div v-if="open" class="modal-mask" @click.self="$emit('close')">
    <div class="modal-sheet">
      <div class="modal-head">
        <button class="modal-btn" @click="$emit('close')">取消</button>
        <div class="modal-title">{{ title }}</div>
        <button class="modal-btn primary" @click="$emit('save')">保存</button>
      </div>
      <div class="modal-body">
        <slot />
        <div v-if="$slots.footer" style="margin-top: 18px">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' }
})
defineEmits(['close', 'save'])
</script>
